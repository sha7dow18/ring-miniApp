"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterProducts = filterProducts;
exports.rankProducts = rankProducts;
function includesWord(text, word) {
    return text.includes(word);
}
function concernMatches(item, concerns) {
    const haystack = [item.name || '', item.desc || '', ...(item.tags || [])].join(' ');
    return (concerns || []).filter((word) => includesWord(haystack, word));
}
function reasonForItem(item, matches, targets) {
    if (matches.length) {
        return `匹配「${matches.slice(0, 2).join(' / ')}」方向，适合近期调理`;
    }
    if ((targets || []).includes(item.category)) {
        return '当前状态和该品类方向更贴合，可优先关注';
    }
    return '适合作为近期状态管理的补充';
}
function filterProducts(items, options = {}) {
    const query = (options.query || '').trim().toLowerCase();
    const tags = options.tags || [];
    const maxPrice = options.maxPrice;
    let out = [...(items || [])].filter((item) => item.onSale !== false);
    if (query) {
        out = out.filter((item) => {
            const text = [item.name || '', item.desc || '', ...(item.tags || [])].join(' ').toLowerCase();
            return text.includes(query);
        });
    }
    if (tags.length) {
        out = out.filter((item) => tags.some((tag) => (item.tags || []).includes(tag) || item.category === tag));
    }
    if (typeof maxPrice === 'number' && !Number.isNaN(maxPrice)) {
        out = out.filter((item) => (parseFloat(item.price || '0') || 0) <= maxPrice);
    }
    return out.slice(0, options.limit || 6);
}
function rankProducts(products, context, limit = 3, weights = { category: 4, concern: 2, affordable: 1, inStock: 1 }) {
    return [...(products || [])]
        .map((item) => {
        const matches = concernMatches(item, context.concerns || []);
        let score = 0;
        if ((context.targets || []).includes(item.category))
            score += weights.category;
        score += matches.length * weights.concern;
        if ((parseFloat(item.price || '0') || 0) > 0 && (parseFloat(item.price || '0') || 0) <= 399)
            score += weights.affordable;
        if (item.stock == null || item.stock > 0)
            score += weights.inStock;
        return {
            ...item,
            matchReason: reasonForItem(item, matches, context.targets || []),
            __score: score
        };
    })
        .sort((a, b) => b.__score - a.__score)
        .slice(0, limit)
        .map((item) => {
        const cloned = { ...item };
        delete cloned.__score;
        return cloned;
    });
}
//# sourceMappingURL=products.js.map