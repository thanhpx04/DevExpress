

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

export function mappingToBodyIssue(values) {
    return {
        fields: {
            summary: values.summary,
            customfield_10015: values.startdate, // Start date - depend on customfield was definded
            duedate: values.duedate,
            assignee: {
                id: values.assignee
            },
            // status: {
            //     id: values.status
            // },
            // customfield_10028: values.storyPoint, // storyPoint - depend on customfield was definded
            issuetype: {
                id: values.issueType
            },
            project: {
                key: values.project.key
            }
        }
    };
}
