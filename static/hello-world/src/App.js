import React, { useEffect, useState } from 'react';
import { TreeList, Editing, Button as CellButton, Column, ColumnChooser } from 'devextreme-react/tree-list';
import { Button } from 'devextreme-react/button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { Template } from 'devextreme-react/core/template';
import SelectBox from 'devextreme-react/select-box';
import { getIssueData, getAllProject, getIssueLinkType, findChildByJql } from "./data/ManageData";
import { findItem } from "./utility/Utility";
import BlockerCell from "./component/BlockerCell";
import TextBox from 'devextreme-react/text-box';
import DataSource from 'devextreme/data/data_source';

function App() {
    let [projectsDataSource, setProjectsDataSource] = useState([]);
    let [projectSelected, setProjectSelected] = useState(null);
    let [issueLinkDataSource, setissueLinkDataSource] = useState([]);
    let [issueLinkSelected, setIssueLinkSelected] = useState(null);
    let [issueKey, setIssueKey] = useState("");
    let [dataSource, setDataSource] = useState([]);
    var dataSourceStore = new DataSource({  
        key: "id",  
        load: function () {  
            return dataSource;  
        },  
        insert: function (values) {
            var parentItem = findItem(dataSource, values.parentId);  
            delete values.parentId;  
            if (!parentItem) {  
                dataSource.push(values);  
            } else {  
                parentItem.children = parentItem.children || [];  
                parentItem.children.push(values);  
            }  
            dataSourceStore.reload();
        },  
        update: function (key, values) {  
            var item = findItem(dataSource, key);  
            if (item) {  
                Object.assign(item, values);  
            }  
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
            setProjectsDataSource(projects);
            setissueLinkDataSource(
                issueLinkTypes.map((ele) => {
                    ele.text = `${ele.inward}\\${ele.outward}`;
                    return ele;
                })
            );
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
        let response = await getIssueData(projectSelected, issueLinkSelected, issueKey);
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

    const onRowExpanding = async (e) => {
        var expandingNode = findItem(dataSource, e.key);
        let response = await findChildByJql(projectSelected, issueLinkSelected, expandingNode.id)
        expandingNode.children = response;
        dataSourceStore.reload();
    }

    return (
        <div>
            <ul class="search-criteria-list">
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
                        allowAdding={true}
                        allowUpdating={true}
                        mode="row"
                    />
                    <Column dataField="id" allowHiding={false} caption="Issue Key" />
                    <Column dataField="summary" caption="Summary" />
                    <Column dataField="startdate" dataType="date" caption="Start Date" />
                    <Column dataField="duedate" dataType="date" caption="Due Date" />
                    <Column dataField="assignee" caption="Assignee" />
                    <Column dataField="status" caption="Status" />
                    <Column dataField="storyPoint" visible={false} caption="Story Point" /> {/* visible to defind column is displayed */}
                    <Column dataField="issueType" caption="Issue Type" />
                    <Column dataField="blockers" visible={false} cellTemplate="blockerTemplate" caption="Blockers" /> {/* cellTemplate to custom displaying */}
                    <Column type="buttons">
                        <CellButton name="add" />
                        <CellButton name="save" />
                        <CellButton name="cancel" />
                    </Column>
                    <ColumnChooser enabled={true} allowSearch={true} mode={"select"} />
                    <Template name="blockerTemplate" render={BlockerCell} />

                </TreeList>
            </div>
        </div>
    );
}

export default App;
