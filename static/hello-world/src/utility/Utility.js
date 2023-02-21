import * as Constants from '../utility/Constants';

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
    let result =  {
        fields: {
            summary: values.summary,
            duedate: values.duedate,
            assignee: {
                id: values.assignee
            },
            // status: {
                //     id: values.status
            // },
            issuetype: {
                id: values.issueType
            },
            project: {
                key: values.project.key
            }
        }
    };
    result.fields[Constants.START_DATE] = values.startdate, // Start date - depend on customfield was definded
    result.fields[Constants.STORY_POINT] = values.storyPoint; // storyPoint - depend on customfield was definded
    result.fields[Constants.SPRINT] = values.sprint; // sprint - depend on customfield was definded
    result.fields[Constants.TEAM] = values.team.toString(); // team - depend on customfield was definded

    return result;
}
