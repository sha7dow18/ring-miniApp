export interface ProductItem {
    _id?: string;
    id: string;
    name: string;
    category: string;
    desc?: string;
    detailPitch?: string;
    image?: string;
    imageName?: string;
    tags?: string[];
    price?: string;
    stock?: number;
    onSale?: boolean;
    matchReason?: string;
}
export interface ProductSearchOptions {
    query?: string;
    tags?: string[];
    maxPrice?: number;
    limit?: number;
}
export interface ProductRecommendContext {
    targets: string[];
    concerns: string[];
    summaryText: string;
}
export declare function filterProducts(items: ProductItem[], options?: ProductSearchOptions): ProductItem[];
export declare function rankProducts(products: ProductItem[], context: ProductRecommendContext, limit?: number, weights?: {
    category: number;
    concern: number;
    affordable: number;
    inStock: number;
}): ProductItem[];
