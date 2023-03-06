import React, { useEffect, useState } from 'react';
import { TreeList, Editing, Button as CellButton, Column, ColumnChooser, Lookup, RequiredRule } from 'devextreme-react/tree-list';
import { Button } from 'devextreme-react/button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { Template } from 'devextreme-react/core/template';
import { getTeams, updateIssue, getSprints, getProjectVersions, getIssueData, getAllProject, getIssueLinkType, findChildByJql, issueType, issueStatus, getListActiveUser, createIssue, linkNewIssue } from "./data/ManageData";
import { findItem, mappingToBodyIssue } from "./utility/Utility";
import { BlockerCell, FixVersionCell } from "./component/TemplateCell";
import TextBox from 'devextreme-react/text-box';
import CustomStore from 'devextreme/data/data_source';
import ProjectMultiSelect from "./component/ProjectMultiSelect";
import LinkTypeSingleSelect from "./component/LinkTypeSingleSelect";
import SprintMultiSelect from "./component/SprintMultiSelect";
import FixedVersionMultiSelect from "./component/FixedVersionMultiSelect";
import TeamMultiSelect from "./component/TeamMultiSelect";

function App() {
    // Filter's components
    let [projectsSelected, setProjectsSelected] = useState([]);
    let [linkTypeSelected, setLinkTypeSelected] = useState(null);
    let [issueKey, setIssueKey] = useState("");
    let [sprintsSelected, setSprintsSelected] = useState([]);
    let [fixedVersionsSelected, setFixedVersionsSelected] = useState([]);
    let [teamsSelected, setTeamsSelected] = useState([]);
    
    // Cell's components
    let [listActiveUser, setListActiveUser] = useState([]);
    let [listSprints, setlistSprints] = useState([]);
    let [listVersions, setlistVersions] = useState([]);
    let [listTeams, setlistTeams] = useState([]);


    let [dataSource, setDataSource] = useState([]);
    var dataSourceStore = new CustomStore({
        key: "id",
        load: function () {
            return dataSource;
        },
        insert: async function (values) {
            console.log(values)
            values.project = projectsSelected[0]; // get the first selected projects, need to discuss show project column?
            let body = mappingToBodyIssue(values);
            let response = await createIssue(JSON.stringify(body));
            values.id = response.key;
            if (values.parentId !== undefined) {
                linkNewIssue(response.key, values.parentId, linkTypeSelected);
            }
            var parentItem = findItem(dataSource, values.parentId);
            if (!parentItem) {
                dataSource.push(values);
            } else {
                parentItem.children = parentItem.children || [];
                parentItem.children.push(values);
                parentItem.hasChildren = true;
            }
            dataSourceStore.reload();
        },
        update: async function (key, values) {
            // update data on client
            var item = findItem(dataSource, key);
            if (item) {
                Object.assign(item, values);
            }

            // update data on server
            let body = mappingToBodyIssue(item);
            await updateIssue(JSON.stringify(body), item.id);
        },
        remove: function (key) {
            var itemWithIndex = findItem(dataSource, key, true);
            if (itemWithIndex) {
                itemWithIndex.children.splice(itemWithIndex.index, 1);
            }
        }
    });
    const [searchButton, setsearchButton] = useState({
        loadIndicatorVisible: false,
        buttonText: 'Search',
    });

    useEffect(() => {
        (async () => {
            let listActiveUser = await getListActiveUser();
            let sprints = await getSprints();
            let versions = await getProjectVersions(projectsSelected);
            let teams = await getTeams();
            setListActiveUser(listActiveUser);
            setlistSprints(sprints);
            setlistVersions(versions);
            setlistTeams(teams);
        })();
    }, []);

    const handleClickSearch = async () => {

        if (projectsSelected.length > 0 && linkTypeSelected != null) {
            setsearchButton({
                loadIndicatorVisible: true,
                buttonText: 'Searching',
            });
            let response = await getIssueData(projectsSelected, linkTypeSelected, issueKey, sprintsSelected, fixedVersionsSelected, teamsSelected);
            setsearchButton({
                loadIndicatorVisible: false,
                buttonText: 'Search',
            });
            setDataSource(response);
            dataSourceStore.load();
        } else {
            alert("Please select Project and Link type!");
            return;
        }
    };

    const handleClickReset = () => {
        setProjectsSelected([]);
        setLinkTypeSelected([]);
        setIssueKey("");
        setSprintsSelected([]);
        setFixedVersionsSelected([]);
        setTeamsSelected([]);
    };

    const onChangeIssueKey = (e) => {
        setIssueKey(e.value);
    }

    const onChangeProjects = (value) => {
        setProjectsSelected(value);
    };

    const onChangeLinkType = (value) => {
        setLinkTypeSelected(value);
    };

    const onChangeSprints = (value) => {
        setSprintsSelected(value);
    };

    const onChangeFixedVersion = (value) => {
        setFixedVersionsSelected(value);
    };

    const onChangeTeams = (value) => {
        setTeamsSelected(value);
    };

    const onRowExpanding = async (e) => {
        let expandingNode = findItem(dataSource, e.key);
        let response = await findChildByJql(expandingNode.project, linkTypeSelected, expandingNode.id)
        expandingNode.children = response;
        dataSourceStore.reload();
    }

    return (
        <div>
            <ul className="search-criteria-list">
                <li>
                    <ProjectMultiSelect
                        value={projectsSelected}
                        onChangeProjects={onChangeProjects}
                    />
                </li>
                <li>
                    <LinkTypeSingleSelect
                        value={linkTypeSelected}
                        onChangeLinkType={onChangeLinkType}
                    />
                </li>
                <li>
                    <SprintMultiSelect
                        value={sprintsSelected}
                        onChangeSprints={onChangeSprints}
                    />
                </li>
                <li>
                    <FixedVersionMultiSelect
                        projects={projectsSelected}
                        value={fixedVersionsSelected}
                        onChangeFixedVersion={onChangeFixedVersion}
                    />
                </li>
                <li>
                    <TeamMultiSelect
                        value={teamsSelected}
                        onChangeTeams={onChangeTeams}
                    />
                </li>
                <li>
                    <TextBox
                        value={issueKey}
                        showClearButton={true}
                        valueChangeEvent="keyup"
                        onValueChanged={onChangeIssueKey}
                        label="Issue key"
                        labelMode={"floating"} />
                </li>
                <li>
                    <Button type="default" stylingMode="contained" onClick={handleClickSearch} >
                        <LoadIndicator className="button-indicator" height={20} width={20} visible={searchButton.loadIndicatorVisible} />
                        <span className="dx-button-text">{searchButton.buttonText}</span>
                    </Button>
                </li>
                <li>
                    <Button text="Reset" type="default" stylingMode="contained" onClick={handleClickReset} />
                </li>
            </ul>
            <div>
                <TreeList
                    dataSource={dataSourceStore}
                    showRowLines={true}
                    showBorders={true}
                    columnAutoWidth={true}
                    allowColumnReordering={true}
                    rootValue=""
                    keyExpr="id"
                    parentIdExpr="parentId"
                    hasItemsExpr="hasChildren"
                    itemsExpr="children"
                    dataStructure="tree"
                    onRowExpanding={onRowExpanding}
                >
                    <Editing
                        allowUpdating={true}
                        allowAdding={true}
                        mode="row"
                    />
                    <Column dataField="id" allowHiding={false} caption="Issue Key" allowEditing={false} />
                    <Column dataField="summary" caption="Summary" />
                    <Column dataField="startdate" dataType="date" caption="Start Date" visible={false} />
                    <Column dataField="duedate" dataType="date" caption="Due Date" visible={false} />
                    <Column
                        dataField="assignee"
                        caption="Assignee">
                        <Lookup
                            dataSource={listActiveUser}
                            searchEnabled={true}
                            searchExpr="displayName"
                            valueExpr="accountId"
                            displayExpr="displayName" />
                    </Column>
                    <Column
                        dataField="status"
                        caption="Status"
                        visible={false}>
                        <Lookup
                            dataSource={issueStatus}
                            valueExpr="id"
                            displayExpr="name" />
                    </Column>
                    <Column dataField="storyPoint" dataType="number" visible={false} caption="Story Point" /> {/* visible to defind column is displayed */}
                    <Column
                        dataField="issueType"
                        caption="Issue Type">
                        <Lookup
                            dataSource={issueType}
                            valueExpr="id"
                            displayExpr="displayName" />
                        <RequiredRule />
                    </Column>
                    <Column dataField="blockers" visible={false} cellTemplate="blockerTemplate" caption="Blockers" /> {/* cellTemplate to custom displaying */}
                    <Column
                        dataField="sprint"
                        caption="Sprint">
                        <Lookup
                            dataSource={listSprints}
                            searchEnabled={true}
                            searchExpr="name"
                            valueExpr="id"
                            displayExpr="name" />
                    </Column>
                    <Column
                        dataField="fixVersions"
                        cellTemplate="fixVersionsTemplate"
                        caption="Fix versions">
                        <Lookup
                            dataSource={listVersions}
                            searchEnabled={true}
                            searchExpr="name"
                            valueExpr="id"
                            displayExpr="name" />
                    </Column>
                    <Column
                        dataField="team"
                        caption="Team">
                        <Lookup
                            dataSource={listTeams}
                            searchEnabled={true}
                            searchExpr="title"
                            valueExpr="id"
                            displayExpr="title" />
                    </Column>
                    <Column type="buttons" caption="Actions">
                        <CellButton name="add" />
                        <CellButton name="edit" />
                        <CellButton name="save" />
                        <CellButton name="cancel" />
                    </Column>
                    <ColumnChooser enabled={true} allowSearch={true} mode={"select"} />
                    <Template name="blockerTemplate" render={BlockerCell} />
                    <Template name="fixVersionsTemplate" render={FixVersionCell} />
                </TreeList>
            </div>
        </div>
    );
}

export default App;
