import React, { useEffect, useState } from 'react';
import { TreeList, Editing, Button as CellButton, Column, ColumnChooser, Lookup, RequiredRule, RowDragging, Selection } from 'devextreme-react/tree-list';
import { Button } from 'devextreme-react/button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { Template } from 'devextreme-react/core/template';
import { getTeams, updateIssue, getSprints, getProjectVersions, getIssueData, getAllProject, getIssueLinkType, findChildByJql, issueType, issueStatus, getListActiveUser, createIssue, savingDragandDrop, onReorderData } from "./data/ManageData";
import { findItem, mappingToBodyIssue, screen } from "./utility/Utility";
import { BlockerCell, FixVersionCell } from "./component/TemplateCell";
import DateBox from 'devextreme-react/date-box';
import ResponsiveBox, { Row, Col, Item, Location } from "devextreme-react/responsive-box";
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
    let selectedData = [];

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
            values.id = response.id;
            values.key = response.key;
            if (values.parentId !== undefined) {
                savingDragandDrop(response.key, values.parentId, linkTypeSelected);
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
        },
        totalCount: function () {
            return dataSource.length;
        }
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
            let response = await getIssueData(projectsSelected, linkTypeSelected, issueKey, sprintsSelected, fixedVersionsSelected, teamsSelected);
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

    const onDragStart = async (e) => {
        selectedData = e.component.getSelectedRowsData();
    }

    const onDragEnd = (e) => {
        e.component.deselectAll();
    }

    const onDragChange = async (e) => {

        let visibleRows = e.component.getVisibleRows(),
            sourceNode = e.component.getNodeByKey(e.itemData.id),
            targetNode = visibleRows[e.toIndex].node;

        while (targetNode && targetNode.data) {
            if (targetNode.data.id === sourceNode.data.id) {
                e.cancel = true;
                break;
            }
            targetNode = targetNode.parent;
        }
    }

    const onReorder = async (e) => {

        if (selectedData.length > 0) {
            let visibleRows = e.component.getVisibleRows(),
                targetData = visibleRows[e.toIndex].data;
            let dropInsideItem = e.dropInsideItem;
            let response;

            for (var i = 0; i < selectedData.length; i++) {
                let sourceData = selectedData[i];
                try {
                    if (i === 0) {
                        response = await onReorderData(sourceData, targetData, dropInsideItem, linkTypeSelected, dataSource);
                    }
                    else {
                        response = await onReorderData(sourceData, targetData, dropInsideItem, linkTypeSelected, response);
                    }
                    setDataSource(response);
                    dataSourceStore.reload();
                }
                catch (err) {
                    console.log("Error ", JSON.stringify(err));
                }
            }
        }
        else {
            let visibleRows = e.component.getVisibleRows(),
                sourceData = e.itemData,
                targetData = visibleRows[e.toIndex].data;
            let dropInsideItem = e.dropInsideItem;

            let response = await onReorderData(sourceData, targetData, dropInsideItem, linkTypeSelected, dataSource);
            setDataSource(response);
            dataSourceStore.reload();
        }
    }

    return (
        <div>
            <div id="page">
                <ResponsiveBox singleColumnScreen="sm" screenByWidth={screen}>
                    <Row ratio={1}></Row>
                    <Row ratio={1}></Row>
                    <Row ratio={1}></Row>

                    <Col ratio={1}></Col>
                    <Col ratio={1}></Col>
                    <Col ratio={1}></Col>
                    <Col ratio={1}></Col>
                    <Col ratio={1}></Col>
                    <Col ratio={1.7}></Col>
                    <Item>
                        <Location row={0} col={0} colspan={6} screen="lg" />
                        <Location row={0} col={0} colspan={6} screen="md" />
                        <Location row={0} col={0} screen="sm" />
                        <ul className="header item">
                            <li className="dropdown-head">
                                <ProjectMultiSelect value={projectsSelected} onChangeProjects={onChangeProjects} />
                            </li>
                            <li>
                                <Button icon="search" type="default" stylingMode="contained" onClick={handleClickSearch} />
                            </li>
                            <li>
                                <Button icon="pulldown" type="default" stylingMode="outlined" onClick={handleClickReset} />
                            </li>
                            <li>
                                <Button icon="save" type="default" stylingMode="outlined" />
                            </li>
                        </ul>
                    </Item>
                    <Item>
                        <Location row={1} col={0} screen="lg" />
                        <Location row={1} col={0} colspan={2} screen="md" />
                        <Location row={1} col={0} screen="sm" />
                                <LinkTypeSingleSelect value={linkTypeSelected} onChangeLinkType={onChangeLinkType} />
                    </Item>
                    <Item>
                        <Location row={1} col={1} screen="lg" />
                        <Location row={1} col={2} colspan={2} screen="md" />
                        <Location row={1} col={1} screen="sm" />
                                <TextBox
                                    value={issueKey}
                                    showClearButton={true}
                                    valueChangeEvent="keyup"
                                    onValueChanged={onChangeIssueKey}
                                    label="Issue key"
                                    labelMode={"floating"} />
                    </Item>
                    <Item>
                        <Location row={1} col={2} screen="lg" />
                        <Location row={1} col={4} colspan={2} screen="md" />
                        <Location row={1} col={2} screen="sm" />
                                <SprintMultiSelect value={sprintsSelected} onChangeSprints={onChangeSprints} />
                    </Item>
                    <Item>
                        <Location row={1} col={3} screen="lg" />
                        <Location row={2} col={0} colspan={2} screen="md" />
                        <Location row={1} col={3} screen="sm" />
                                <FixedVersionMultiSelect projects={projectsSelected} value={fixedVersionsSelected} onChangeFixedVersion={onChangeFixedVersion} />
                    </Item>
                    <Item>
                        <Location row={1} col={4} screen="lg" />
                        <Location row={2} col={2} colspan={2} screen="md" />
                        <Location row={1} col={4} screen="sm" />
                                <TeamMultiSelect value={teamsSelected} onChangeTeams={onChangeTeams} />
                    </Item>
                    <Item>
                        <Location row={1} col={5} screen="lg" />
                        <Location row={2} col={4} colspan={2} screen="md" />
                        <Location row={1} col={5} screen="sm" />
                        <div>
                        <div className="date-same-dropdown">

                                <DateBox type="date" labelMode={"floating"} label='Start' />
                                </div>
                        <div className="date-same-dropdown">
                                <DateBox type="date" labelMode={"floating"} label='End' />
                        </div>

                        </div>
                    </Item>
                </ResponsiveBox>
            </div>
            <div>
                <TreeList
                    dataSource={dataSourceStore}
                    showRowLines={true}
                    showBorders={true}
                    columnAutoWidth={true}
                    allowColumnReordering={true}
                    rootValue={-1}
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

                    <Selection
                        mode="multiple"
                        recursive={true}
                    />

                    <RowDragging
                        onDragChange={onDragChange}
                        onReorder={onReorder}
                        allowDropInsideItem={true}
                        allowReordering={true}
                        showDragIcons={false}
                        onDragEnd={onDragEnd}
                        onDragStart={onDragStart}
                    />

                    <Column dataField="key" allowHiding={false} caption="Issue Key" allowEditing={false} />
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
