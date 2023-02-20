import { requestJira } from "@forge/bridge"
import * as Constants from '../utility/Constants';

const data = async (projects, linkType, issueKey) => {
    // let listProject = projects.map(element => JSON.stringify(element.key))
    // const params = issueKey === "" ? `project in (${listProject}) AND (filter != ${linkType.id})` : `project in (${listProject}) AND (filter != ${linkType.id}) AND issue =${issueKey}`;
    const params = issueKey === "" ? `project = ${projects.name} AND (filter != "${linkType.id}")` : `project = ${projects.name} AND (filter != "${linkType.id}") AND issue =${issueKey}`;
    const response = await requestJira(`/rest/api/2/search?jql=${params}`);
    return await response.json();
};

export const getIssueData = async (projects, linkType, issueKey) => {
    if (projects == null && linkType == null) {
        return [];
    }
    const result = await data(projects, linkType, issueKey);
    if (result.errorMessages) {
        return {
            error: result.errorMessages
        };
    }
    let issues = [];
    await Promise.all(result.issues.map(async (element) => {
        let item = {
            id: element.key,
            summary: element.fields.summary,
            startdate: element.fields[Constants.START_DATE], // depend on customfield was definded
            duedate: element.fields.duedate,
            assignee: element.fields.assignee ? element.fields.assignee.accountId : null,
            status: element.fields.status.name,
            storyPoint: element.fields[Constants.STORY_POINT], // depend on customfield was definded
            issueType: element.fields.issuetype.id,
            blockers: getBlockersString(element),
            sprint: element.fields[Constants.SPRINT] ? element.fields[Constants.SPRINT][0].id : null, // depend on customfield was definded
            fixVersions: element.fields.fixVersions,
            // displayFixVersions: getfixVersions(element.fields.fixVersions),
            hasChildren: getIssueChildLink(element, linkType).length > 0,
            parentId: "" // level 1 of tree
        }
        issues.push(item)
    }))
    return issues;
}

export const findChildByJql = async (projects, linkType, issueKey) => {
    // let listProject = projects.map(element => JSON.stringify(element.key))
    // let jqlFindChildByID = `project in (${listProject}) and issue in linkedIssues("${issue.key}", ${linkType.outward})`
    let jqlFindChildByID = `project = ${projects.name} and issue in linkedIssues("${issueKey}", "${linkType.outward}")`
    let url = `/rest/api/2/search?jql=${jqlFindChildByID}`
    const response = await requestJira(url);
    const data = await response.json();
    let listChildren = []
    await Promise.all(data.issues.map(async (element) => {
        let item = {
            id: element.key,
            summary: element.fields.summary,
            startdate: element.fields[Constants.START_DATE], // depend on customfield was definded
            duedate: element.fields.duedate,
            assignee: element.fields.assignee ? element.fields.assignee.accountId : null,
            status: element.fields.status.name,
            storyPoint: element.fields[Constants.STORY_POINT], // depend on customfield was definded
            issueType: element.fields.issuetype.id,
            blockers: getBlockersString(element),
            sprint: element.fields[Constants.SPRINT] ? element.fields[Constants.SPRINT][0].id : null, // depend on customfield was definded
            hasChildren: getIssueChildLink(element, linkType).length > 0,
            parentId: issueKey
        }
        listChildren.push(item);
    }))
    return listChildren;
}
const getIssueChildLink = (element, linkType) => {
    let result = element.fields.issuelinks.filter(link => {
        return link.outwardIssue && link.type.outward === linkType.outward
    });
    return result;
}

const getBlockersString = (issue) => {
    const INWARD_IS_BLOCKED_BY = "is blocked by";
    if (!issue.fields.issuelinks) return '';
    let blockerToView = [];
    issue.fields.issuelinks.forEach(link => {
        if (link.type.inward === INWARD_IS_BLOCKED_BY && link.inwardIssue) {
            if (!link.inwardIssue) return '';
            blockerToView.push(
                { key: link.inwardIssue.key }
            );
        }
    });
    return blockerToView;
}

export const getBoards = async () => {
    const response = await requestJira(`/rest/agile/1.0/board`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    });
    let result = await response.json();
    return result.values;
}

export const getBoardSprints = async (boardID) => {
    const response = await requestJira(`/rest/agile/1.0/board/${boardID}/sprint`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    });
    let result = await response.json();
    return result.values.filter(sprint => sprint.state === "active");
}

export const getSprints = async (boards) => {
    const result = await Promise.all(
        boards.map(async (e) => {
            return await getBoardSprints(e.id);
        })
    )
    return result.flat();
}

export const getAllProject = async () => {
    const response = await requestJira(`/rest/api/2/project/search`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    });
    let result = await response.json();
    return result.values;
};

export const getIssueLinkType = async (props) => {
    const response = await requestJira(`/rest/api/2/issueLinkType`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    });
    let result = await response.json();
    return result.issueLinkTypes;
};

export const issueType = [
    { id: 10006, name: 'Story' },
    { id: 10009, name: 'Bug' },
    { id: 10018, name: 'Request' },
    { id: 10007, name: 'Task' },
    { id: 10019, name: 'Test' },
    { id: 10022, name: 'Test Execution' },
    { id: 10021, name: 'Test Plan' },
    { id: 10020, name: 'Test Set' },
    { id: 10023, name: 'Precondition' }
]

export const issueStatus = [
    { id: 10043, name: 'NEW' },
    { id: 3, name: 'In Progress' },
    { id: 6, name: 'Closed' },
    { id: 10035, name: 'Cancelled' }
]

export const getListActiveUser = async (aa) => {
    const response = await requestJira(`/rest/api/2/users/search`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    });
    let result = await response.json();
    return result.filter(account => {
        return account.active && account.accountType === "atlassian"
    });
};

export const createIssue = async (body) => {
    const response = await requestJira('/rest/api/2/issue', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: body
    })
    console.log(`Response: ${response.status} ${response.statusText}`);
    return await response.json()
}

const deleteIssueLink = async (issueLinkID) => {
    const response = await requestJira(`/rest/api/2/issueLink/${issueLinkID}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    });
    console.log(`Response: ${response.status} ${response.statusText}`);
    console.log(await response.text());

}

export const linkNewIssue = async (outwardKey, inwardKey, issueLinkType) => {
    let body = {
        "outwardIssue": {
            "key": outwardKey
        },
        "inwardIssue": {
            "key": inwardKey
        },
        "type": {
            "name": issueLinkType.name
        }
    }
    const response = await requestJira(`/rest/api/2/issueLink`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    console.log(`Response: ${response.status} ${response.statusText}`);
    console.log(await response.text());
}

export const updateIssueLink = async (newParentKey, oldParentID, childKey, issueLinkType) => {
    if (oldParentID !== null) {
        const response = await requestJira(`/rest/api/2/issue/${childKey}?fields=issuelinks`);
        const data = await response.json()
        const oldIssueLinksChild = await data.fields.issuelinks
        const oldIssueLink = await oldIssueLinksChild.find(
            element =>
            (element.inwardIssue !== undefined &&
                element.type.id === issueLinkType.id &&
                element.inwardIssue.id === oldParentID));
        //delete old issue link
        deleteIssueLink(oldIssueLink.id)
    }
    //add new link issue
    linkNewIssue(childKey, newParentKey, issueLinkType)
}