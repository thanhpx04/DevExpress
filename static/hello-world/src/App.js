import React, { useEffect, useState } from 'react';
import { TreeList, Editing, Button as CellButton, Column, ColumnChooser, Lookup, RequiredRule } from 'devextreme-react/tree-list';
import { Button } from 'devextreme-react/button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { Template } from 'devextreme-react/core/template';
import SelectBox from 'devextreme-react/select-box';
import { getTeams, updateIssue, getBoards, getSprints, getIssueData, getAllProject, getIssueLinkType, findChildByJql, issueType, issueStatus, getListActiveUser, createIssue, linkNewIssue } from "./data/ManageData";
import { findItem, mappingToBodyIssue } from "./utility/Utility";
import { BlockerCell, FixVersionCell } from "./component/TemplateCell";
import TextBox from 'devextreme-react/text-box';
import CustomStore from 'devextreme/data/data_source';
import FixedVersionFilter from "./component/FixedVersionFilter";
import TeamFilter from "./component/TeamFilter";

function App() {
    let [projectsDataSource, setProjectsDataSource] = useState([]);
    let [projectSelected, setProjectSelected] = useState(null);
    let [issueLinkDataSource, setissueLinkDataSource] = useState([]);
    let [listActiveUser, setListActiveUser] = useState([]);
    let [listTeams, setlistTeams] = useState([]);
    let [listSprints, setlistSprints] = useState([]);
    let [sprintSelected, setSprintSelected] = useState(null);
    let [fixedVersionSelected, setFixedVersionSelected] = useState(null);
    let [teamSelected, setTeamSelected] = useState(null);
    let [issueLinkSelected, setIssueLinkSelected] = useState(null);
    let [issueKey, setIssueKey] = useState("");
    let [dataSource, setDataSource] = useState([]);
    var dataSourceStore = new CustomStore({
        key: "id",
        load: function () {
            return dataSource;
        },
        insert: async function (values) {
            values.project = projectSelected;
            let body = mappingToBodyIssue(values);
            let response = await createIssue(JSON.stringify(body));
            values.id = response.key;
            if (values.parentId !== undefined) {
                linkNewIssue(response.key, values.parentId, issueLinkSelected);
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
            let projects = await getAllProject();
            let issueLinkTypes = await getIssueLinkType();
            let listActiveUser = await getListActiveUser();
            let boards = await getBoards();
            let sprints = await getSprints(boards);
            let teams = await getTeams();
            setProjectsDataSource(projects);
            setissueLinkDataSource(
                issueLinkTypes.map((ele) => {
                    ele.text = `${ele.inward}\\${ele.outward}`;
                    return ele;
                })
            );
            setListActiveUser(listActiveUser);
            setlistSprints(sprints);
            setlistTeams(teams);
        })();
    }, []);

    const handleClickSearch = async () => {
        if (projectSelected === null || projectSelected.name === "") {
            alert("Please select project");
            return;
        }
        if (issueLinkSelected === null || issueLinkSelected === "") {
            alert("Please select link type of issue");
            return;
        }
        setsearchButton({
            loadIndicatorVisible: true,
            buttonText: 'Searching',
        });
        let response = await getIssueData(projectSelected, issueLinkSelected, issueKey, (sprintSelected ? [sprintSelected] : null), (fixedVersionSelected ? [fixedVersionSelected] : null), (teamSelected ? [teamSelected] : null));
        setsearchButton({
            loadIndicatorVisible: false,
            buttonText: 'Search',
        });
        setDataSource(response);
        dataSourceStore.load();
    };

    const handleClickReset = () => {
        setProjectSelected(null);
        setIssueLinkSelected(null);
        setSprintSelected(null);
        setIssueKey("");
    };

    const onProjectSelectedChanged = (e) => {
        setProjectSelected(e.value);
    };

    const onChangeLinkIssueType = (e) => {
        setIssueLinkSelected(e.value);
    };

    const onChangeIssueKey = (e) => {
        setIssueKey(e.value);
    }

    const onChangeSprint = (e) => {
        setSprintSelected(e.value);
    };

    const onChangeFixedVersion = (value) => {
        setFixedVersionSelected(value);
    };

    const onChangeTeam = (value) => {
        setTeamSelected(value);
    };

    const onRowExpanding = async (e) => {
        var expandingNode = findItem(dataSource, e.key);
        let response = await findChildByJql(projectSelected, issueLinkSelected, expandingNode.id)
        expandingNode.children = response;
        dataSourceStore.reload();
    }

    return (
        <div>
            <ul className="search-criteria-list">
                <li>
                    <SelectBox
                        value={projectSelected}
                        displayExpr="name"
                        dataSource={projectsDataSource}
                        labelMode={"floating"}
                        label='Select project'
                        onValueChanged={onProjectSelectedChanged}
                    />
                </li>
                <li>
                    <SelectBox
                        value={issueLinkSelected}
                        displayExpr="name"
                        dataSource={issueLinkDataSource}
                        labelMode={"floating"}
                        label='Select Issue Link Type'
                        onValueChanged={onChangeLinkIssueType}
                    />
                </li>
                <li>
                    <SelectBox
                        value={sprintSelected}
                        displayExpr="name"
                        dataSource={listSprints}
                        labelMode={"floating"}
                        label='Select Sprint'
                        onValueChanged={onChangeSprint}
                    />
                </li>
                <li>
                    <FixedVersionFilter
                        projects={projectSelected}
                        value={fixedVersionSelected}
                        onChangeFixedVersion={onChangeFixedVersion}
                    ></FixedVersionFilter>
                </li>
                <li>
                    <TeamFilter
                        value={teamSelected}
                        onChangeTeam={onChangeTeam}
                    ></TeamFilter>
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
                        {/* <Lookup
                            dataSource={listActiveUser}
                            searchEnabled={true}
                            searchExpr="displayName"
                            valueExpr="accountId"
                            displayExpr="displayName" /> */}
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
