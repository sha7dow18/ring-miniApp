# Seed Data

一次性导入云库的初始数据。

## products.jsonl

4 个商城商品。**格式：JSON Lines**（每行一个 JSON 对象，无数组包裹），这是微信云开发数据导入要求的格式。

### 导入步骤

1. 微信开发者工具 → 云开发控制台 → 环境 `ring-9gl8ntyu292bc1e7`
2. 左侧 "数据库" → 选 `products` 集合
3. 右上角"导入" → 选 `docs/seed-data/products.jsonl`
4. 冲突处理选"覆盖" → 确定
5. 导入完刷新小程序 mall 页应看到 4 个商品

### 权限

保持"所有人可读，仅管理员可写"。小程序端只读商品。目录更新在云控制台手动覆盖导入。

### 为什么不做 fallback

mall 页严格从 `products` 云集合读。若集合为空会显示空态，不再回退到本地 mock 数据——强制云库为单一事实源，避免"看着能用但数据路径是假的"。

## 其它集合

其他集合（`users` / `user_profile` / `health_records` / `chat_sessions` / `cart_items` / `orders`）都是每用户私有数据，运行时由应用自动创建，不需要种子。
