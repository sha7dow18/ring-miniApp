import asyncio
import struct
import time
from typing import Optional, Tuple, List
from bleak import BleakScanner, BleakClient
from bleak.exc import BleakDeviceNotFoundError

TARGET_NAME = "uAita H1L 86B6"
PREFER_WRITE_SERVICE = "00002760-08C2-11E1-9073-0E8AC72E1001".lower()
PREFER_NOTIFY_SERVICE = "BAE80001-4F05-4503-8E65-3AF1F7329D1F".lower()

def to_hex(b: bytes) -> str:
    return b.hex().upper()

def build_frame(frame_id: int, cmd: int, subcmd: int, data: bytes=b"") -> bytes:
    return bytes([0x00, frame_id & 0xFF, cmd & 0xFF, subcmd & 0xFF]) + data

def le64_ms(ms: int) -> bytes:
    return struct.pack("<Q", ms)

def build_sync_time(tz: int=8) -> bytes:
    return build_frame(int(time.time()*1000) & 0xFF, 0x10, 0x00, le64_ms(int(time.time()*1000)) + bytes([tz & 0xFF]))

def pick_write_notify(services) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
    write_svc = None
    write_char = None
    notify_svc = None
    notify_char = None
    for s in services:
        if s.uuid.lower() == PREFER_WRITE_SERVICE:
            write_svc = s.uuid
            for c in s.characteristics:
                props = c.properties or []
                if "write" in props or "write-without-response" in props or "write_without_response" in props:
                    write_char = c.uuid
                    break
        if s.uuid.lower() == PREFER_NOTIFY_SERVICE:
            notify_svc = s.uuid
            for c in s.characteristics:
                props = c.properties or []
                if "notify" in props or "indicate" in props:
                    notify_char = c.uuid
                    break
    if not write_char:
        for s in services:
            for c in s.characteristics:
                props = c.properties or []
                if "write" in props or "write-without-response" in props or "write_without_response" in props:
                    write_svc = s.uuid
                    write_char = c.uuid
                    break
            if write_char:
                break
    if not notify_char:
        for s in services:
            for c in s.characteristics:
                props = c.properties or []
                if "notify" in props or "indicate" in props:
                    notify_svc = s.uuid
                    notify_char = c.uuid
                    break
            if notify_char:
                break
    return write_svc, write_char, notify_svc, notify_char

def collect_notifies(services) -> List[str]:
    out = []
    for s in services:
        for c in s.characteristics:
            props = c.properties or []
            if "notify" in props or "indicate" in props:
                out.append(c.uuid)
    return out

async def find_device_by_name(name: str, timeout: float = 15.0):
    def _f(d, ad):
        n = (d.name or "").strip()
        return n == name or (n and name in n)
    return await BleakScanner.find_device_by_filter(_f, timeout=timeout)

async def main():
    target = await find_device_by_name(TARGET_NAME, timeout=20.0)
    if not target:
        print("NOT FOUND", TARGET_NAME)
        return
    # 优先使用 BLEDevice 对象连接（Windows 更稳定）
    try:
        client = BleakClient(target, timeout=30.0)
        await client.__aenter__()
    except BleakDeviceNotFoundError:
        # 回退使用 address 连接
        client = BleakClient(getattr(target, "address", target), timeout=30.0)
        await client.__aenter__()
    try:
        # 兼容不同 bleak 版本的服务获取方式
        svcs = None
        try:
            svcs = await client.get_services()  # 新版 API
        except AttributeError:
            svcs = client.services  # 旧版属性
            if svcs is None:
                await asyncio.sleep(1.0)
                svcs = client.services
        print("SERVICES")
        for s in svcs:
            print(s.uuid)
        write_svc, write_char, notify_svc, notify_char = pick_write_notify(svcs)
        print("WRITE", write_svc, write_char)
        print("NOTIFY", notify_svc, notify_char)
        rx = []
        notifies = collect_notifies(svcs)
        if notifies:
            async def start_n(uuid):
                await client.start_notify(uuid, lambda _, data: (rx.append(to_hex(bytes(data))), print("RX", to_hex(bytes(data)))))
            for n in notifies[:4]:
                try:
                    await start_n(n)
                    print("SUB", n)
                except Exception as e:
                    print("SUB_FAIL", n, e)
        if write_char:
            async def safe_write(payload: bytes):
                try:
                    await client.write_gatt_char(write_char, payload, response=True)
                except Exception:
                    # 兼容仅支持 write-without-response 的特征
                    await client.write_gatt_char(write_char, payload, response=False)
            v = build_frame(int(time.time()*1000)&0xFF, 0x11, 0x00, b"")
            print("TX", to_hex(v))
            await safe_write(v)
            await asyncio.sleep(1.0)
            v = build_frame(int(time.time()*1000)&0xFF, 0x11, 0x01, b"")
            print("TX", to_hex(v))
            await safe_write(v)
            await asyncio.sleep(1.0)
            v = build_sync_time(8)
            print("TX", to_hex(v))
            await safe_write(v)
            await asyncio.sleep(1.0)
            v = build_frame(int(time.time()*1000)&0xFF, 0x12, 0x00, b"")
            print("TX", to_hex(v))
            await safe_write(v)
            await asyncio.sleep(2.0)
        for n in notifies:
            try:
                await client.stop_notify(n)
            except Exception:
                pass
    finally:
        await client.__aexit__(None, None, None)

if __name__ == "__main__":
    asyncio.run(main())