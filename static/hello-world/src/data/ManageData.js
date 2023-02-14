import { requestJira } from "@forge/bridge"

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
            startdate: element.fields.customfield_10015, // depend on customfield was definded
            duedate: element.fields.duedate,
            assignee: element.fields.assignee ? element.fields.assignee.displayName : null,
            status: element.fields.status.name,
            storyPoint: element.fields.customfield_10028, // depend on customfield was definded
            issueType: element.fields.issuetype.name,
            blockers: getBlockersString(element),
            hasChildren: getIssueChildLink(element, linkType).length > 0,
            parentId: "" // level 1 of tree
        }
        issues.push(item)
    }))
    console.log(issues)
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
            startdate: element.fields.customfield_10015, // depend on customfield was definded
            duedate: element.fields.duedate,
            assignee: element.fields.assignee ? element.fields.assignee.displayName : null,
            status: element.fields.status.name,
            storyPoint: element.fields.customfield_10028, // depend on customfield was definded
            issueType: element.fields.issuetype.name,
            blockers: getBlockersString(element),
            hasChildren: getIssueChildLink(element, linkType).length > 0,
            parentId: issueKey
        }
        listChildren.push(item);
    }))
    return listChildren;
}
const getIssueChildLink = ( element, linkType) => {
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

const linkNewIssue = async (outwardKey, inwardKey, issueLinkType) => {
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