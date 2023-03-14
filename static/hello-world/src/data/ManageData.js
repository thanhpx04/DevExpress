import { invoke, requestJira } from "@forge/bridge"
import * as Constants from '../utility/Constants';

const fetchDataWithJQL = async (params) => {
    console.log(params)
    const response = await requestJira(`/rest/api/2/search?jql=${params}`);
    return await response.json();
};

export const getIssueData = async (projects, linkType, issueKey, sprints, versions, teams) => {
    let params = issueKey === "" ? `project in (${projects}) AND (filter != "${linkType.id}")` : `project in (${projects}) AND (filter != "${linkType.id}") AND issue =${issueKey}`;
    
    // checking sprint
    if (sprints && sprints.length > 0) {
        // const sprintIDs = sprints.map((e) => e.id);
        params = params.concat(
            ` AND sprint in (${sprints.join(',')})`
        );
    }
    // checking project's version
    if (versions && versions.length > 0) {
        params = params.concat(
            ` AND fixVersion in (${versions.join(',')})`
        );
    }
    // checking teams
    if (teams && teams.length > 0) {
        params = params.concat(
            ` AND team in (${teams.join(',')})`
        );
    }

    if (projects == null && linkType == null) {
        return [];
    }
    const result = await fetchDataWithJQL(params);
    if (result.errorMessages) {
        return {
            error: result.errorMessages
        };
    }
    let issues = [];
    await Promise.all(result.issues.map(async (element) => {
        let item = {
            id:element.id,
            key: element.key,
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
            project: element.fields.project,
            team: element.fields[Constants.TEAM] ? Number(element.fields[Constants.TEAM].id) : null, // depend on customfield was definded
            hasChildren: getIssueChildLink(element, linkType).length > 0,
            parentId: "-1" // level 1 of tree
        }
        issues.push(item)
    }))
    return issues;
}

export const findChildByJql = async (project, linkType, issueKey) => {
    // let listProject = projects.map(element => JSON.stringify(element.key))
    let jqlFindChildByID = `project in ("${project.id}") and issue in linkedIssues("${issueKey}", "${linkType.outward}")`
    let url = `/rest/api/2/search?jql=${jqlFindChildByID}`
    const response = await requestJira(url);
    const data = await response.json();
    let listChildren = []
    await Promise.all(data.issues.map(async (element) => {
        let item = {
            id:element.id,
            key: element.key,
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
            project: element.fields.project,
            team: element.fields[Constants.TEAM] ? element.fields[Constants.TEAM].id : null, // depend on customfield was definded
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

export const getProjectVersions = async (projectIdOrKey) => {
    const response = await requestJira(`/rest/api/2/project/${projectIdOrKey}/versions`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    });
    let result = await response.json();
    return result;
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

export const getSprints = async () => {
    const response = await requestJira(`/rest/agile/1.0/board`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    });
    let data = await response.json();
    let boards =  data.values.filter(board => board.type !== "kanban"); // need to remove kanban board due to not support sprint
    
    const result = await Promise.all(
        boards.map(async (e) => {
            return await getBoardSprints(e.id);
        })
    )
    return Array.from(new Set(result.flat().map(a => a.id)))
        .map(id => {
            return result.flat().find(a => a.id === id)
        }) // result.flat() return list item but not unique. solution to remove duplicate
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
    { id: "10012", displayName: 'Story' },
    { id: "10013", displayName: 'Task' },
    { id: "10015", displayName: 'Bug' },
    { id: "10014", displayName: 'Sub-task' },
    { id: "10000", displayName: 'Epic' }

    // { id: "10022", displayName: 'Test Execution' },
    // { id: "10021", displayName: 'Test Plan' },
    // { id: "10020", displayName: 'Test Set' },
    // { id: "10023", displayName: 'Precondition' }
]

export const issueStatus = [
    { id: "10043", name: 'NEW' },
    { id: "3", name: 'In Progress' },
    { id: "6", name: 'Closed' },
    { id: "10035", name: 'Cancelled' }
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

export const updateIssue = async (body, issueIdOrKey) => {
    const response = await requestJira(`/rest/api/2/issue/${issueIdOrKey}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: body
    })
    console.log(`Response: ${response.status} ${response.statusText}`);
    return response.status
}


export const getTeams = async (title) => {
    const rs = await invoke("getTeams", { title: title });
    return rs.teams;
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

// export const linkNewIssue = async (outwardKey, inwardKey, issueLinkType) => {
//     let body = {
//         "outwardIssue": {
//             "key": outwardKey
//         },
//         "inwardIssue": {
//             "key": inwardKey
//         },
//         "type": {
//             "name": issueLinkType.name
//         }
//     }
//     const response = await requestJira(`/rest/api/2/issueLink`, {
//         method: 'POST',
//         headers: {
//             'Accept': 'application/json',
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(body)
//     })
//     console.log(`Response: ${response.status} ${response.statusText}`);
//     console.log(await response.text());
// }

// export const updateIssueLink = async (newParentKey, oldParentID, childKey, issueLinkType) => {
//     if (oldParentID !== null) {
//         const response = await requestJira(`/rest/api/2/issue/${childKey}?fields=issuelinks`);
//         const data = await response.json()
//         const oldIssueLinksChild = await data.fields.issuelinks
//         const oldIssueLink = await oldIssueLinksChild.find(
//             element =>
//             (element.inwardIssue !== undefined &&
//                 element.type.id === issueLinkType.id &&
//                 element.inwardIssue.id === oldParentID));
//         //delete old issue link
//         deleteIssueLink(oldIssueLink.id)
//     }
//     //add new link issue
//     linkNewIssue(childKey, newParentKey, issueLinkType)
// }


const getOldIssueLinksChild = async (fieldsLink, key) => 
    { 
    var itemId;  
        for (var i = 0; i < fieldsLink.length; i++)
        {  console.log("fieldsLink: ",fieldsLink[i]);
            if(fieldsLink[i].hasOwnProperty("inwardIssue"))
            {
            if(fieldsLink[i].inwardIssue.id === key)
                itemId = fieldsLink[i].id;
            }
        }
    return itemId;
    }
  
  const updateIssueLink = async (sourceData, targetData, issueLinkSelected) => 
    {      
      const response = await requestJira(`/rest/api/2/issue/${sourceData.id}?fields=issuelinks`); 
      const data = await response.json()
      const oldIssueLinksChild = await data.fields.issuelinks
      const oldIssueLink = await getOldIssueLinksChild(oldIssueLinksChild, targetData.id);
      deleteIssueLink(oldIssueLink)
      //add new link issue
      const responseLink = await requestJira(`/rest/api/2/issue/${targetData.parentId}`);
      const dataLink = await responseLink.json();
     savingDragandDrop(sourceData.key, dataLink.key, issueLinkSelected);
    }
  
  export const savingDragandDrop = async (source, target, issueLinkSelected) => 
  {   
    let body =
    {
        "outwardIssue": {
            "key": source
        },
        "inwardIssue": {
            "key": target
        },
        "type": {
            "name": issueLinkSelected.name
        }
    }
    try{
      const response = await requestJira(`/rest/api/3/issueLink`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
       })
      console.log(JSON.stringify(response));
    }catch(err)
    {
      console.log("Error ",JSON.stringify(err));
    }
  }

  export const onReorderData= async (source, target, dropInsideItem, issueLinkSelected, dataSource) => 
  { 
    let sourceData = source;
    let targetData = target;

    let sourceIndex;
    let tempDataSource = dataSource;

    if (dropInsideItem) {
        if(sourceData.parentId !== -1)
        {          
          const response = await requestJira(`/rest/api/2/issue/${sourceData.id}?fields=issuelinks`);
          const data = await response.json()
          const oldIssueLinksChild = await data.fields.issuelinks
          const oldIssueLink = await getOldIssueLinksChild(oldIssueLinksChild, sourceData.parentId);
          deleteIssueLink(oldIssueLink)
          savingDragandDrop(sourceData.key, targetData.key, issueLinkSelected);

          tempDataSource.map(e => {
            if(e.id === sourceData.parentId && e.hasOwnProperty("children"))
            {
              e.children =  e.children.filter(function (ele){ return ele.key !== sourceData.key})
                if(e.children.length === 0)
                {
                  e.hasChildren = false;
                  delete e.children;
                }
            }
          });

          tempDataSource.map(e => {
            if(e.key === targetData.key && e.hasOwnProperty("children"))
              {
                e.children.push(sourceData);
              }
            else if(e.key === targetData.key)
              {
                let finalsourceData = [];
                finalsourceData.push(sourceData);

                e.children = finalsourceData;
                e.hasChildren = true;
              }
          });
        }
        else
        {
          
          savingDragandDrop(sourceData.key, targetData.key, issueLinkSelected);
          
          sourceIndex = tempDataSource.map(e => e.key).indexOf(sourceData.key) 
          sourceData.parentId = targetData.id;
          tempDataSource = [
            ...tempDataSource.slice(0, sourceIndex),
            ...tempDataSource.slice(sourceIndex + 1),
          ];
          
          tempDataSource.map(e => {
            if(e.key === targetData.key && e.hasOwnProperty("children"))
              {
                
                e.children.push(sourceData);
                
              }
            else if(e.key === targetData.key)
              {
                let finalSourceData = [];
                finalSourceData.push(sourceData);

                e.children = finalSourceData;
                e.hasChildren = true;
                
              }
          });
          
        }
      }
      else {
        if (sourceData.parentId !== targetData.parentId) 
        {
          if(targetData.parentId !== -1)
          {
            updateIssueLink(sourceData, targetData, issueLinkSelected);
            tempDataSource.map(e => {
              if(e.id === sourceData.parentId && e.hasOwnProperty("children"))
                e.children.pop(sourceData);
            });
            sourceData = { ...sourceData, parentId: targetData.parentId };
            tempDataSource.map(e => {
              if(e.id === targetData.parentId && e.hasOwnProperty("children"))
                e.children.push(sourceData);
            });
          }
          else
          {
            const response = await requestJira(`/rest/api/2/issue/${sourceData.id}?fields=issuelinks`);
            const data = await response.json()
            const oldIssueLinksChild = await data.fields.issuelinks
            const oldIssueLink = await getOldIssueLinksChild(oldIssueLinksChild, sourceData.parentId);
            deleteIssueLink(oldIssueLink)
            
            tempDataSource.map(e => {
              if(e.id === sourceData.parentId && e.hasOwnProperty("children"))
              {
                e.children =  e.children.filter(function (e){ return e.key !== sourceData.key})
                if(e.children.length === 0)
                {
                  e.hasChildren = false;
                  delete e.children;
                }
              }
            });
            sourceIndex = tempDataSource.map(e => e.id).indexOf(sourceData.parentId);
            sourceData = { ...sourceData, parentId: -1 };
            tempDataSource = [
              ...tempDataSource.slice(0, sourceIndex+1),
              sourceData,
              ...tempDataSource.slice(sourceIndex + 1),
            ];
          }
        }
      }
      return tempDataSource;
}