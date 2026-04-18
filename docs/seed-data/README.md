# Seed Data

一次性需要导入云库的初始数据。

## products.json

4 个商城种子商品。`productService.listProducts()` 在云 `products` 集合为空时会自动回退到 `mockStore` 里同样的 4 条，所以**不导入也能跑**；导入后走真实云读。

### 导入步骤

1. 打开[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/stable.html) → 云开发控制台 → 当前环境 (ring-9gl8ntyu292bc1e7)
2. 左侧菜单选"数据库" → 选 `products` 集合
3. 顶部右侧点"导入" → 选择 `docs/seed-data/products.json` → 冲突处理选"覆盖" → 确定
4. 导入完成后刷新小程序的 mall 页，应该看到商品（数量与 json 中一致）

### 权限说明

`products` 集合权限建议保持"所有人可读，仅管理员可写"。小程序端无法直接写入（种子操作属于管理动作）。若要更新目录，在云控制台手动改 json 后重新导入。

## 其他集合

其他集合（`users` / `user_profile` / `health_records` / `chat_sessions` / `cart_items` / `orders`）都是每用户私有数据，运行时由应用自动创建，不需要种子。
