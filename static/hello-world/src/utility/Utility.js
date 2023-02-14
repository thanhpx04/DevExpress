

export function findItem(items, key, withIndex) {  
    var item;  
    for (var i = 0; i < items.length; i++) {  
        item = items[i];  
        if (item.id === key) {  
            return withIndex ? { item, items, index: i } : item;  
        }  
        item = item.children && findItem(item.children, key, withIndex);  
        if (item) {  
            return item;  
        }  
    }  
}