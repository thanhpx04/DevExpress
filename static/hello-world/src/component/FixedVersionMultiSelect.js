import React, { useEffect, useState } from 'react';
import { getProjectVersions } from "../data/ManageData";
import TreeView from 'devextreme-react/tree-view';
import DropDownBox from 'devextreme-react/drop-down-box';
import CustomStore from 'devextreme/data/data_source';

const FixedVersionMultiSelect = (props) => {

    let [treeBoxValue, setTreeBoxValue] = useState([]);
    let [treeDataSource, setTreeDataSource] = useState([]);
    let treeView = null;
    let listProject = props.projects;
    // control variables
    let currentPage = 1;
    const limit = 10;
    let total = 0;

    var treeDataSourceStore = new CustomStore({
        key: "id",
        load: function () {
            return treeDataSource;
        },
        insert: async function (values) {
            treeDataSource.push(values);
            treeDataSourceStore.reload();
        },
        totalCount: function () {
            return treeDataSource.length;
        }
    });

    useEffect(() => {
        (async () => {
            if (listProject.length > 0) {
                let versions = await getProjectVersions(listProject, 0, 10);
                versions && setTreeDataSource(versions.values);
                treeDataSourceStore.load();
                setTreeBoxValue([]);

                // setTimeout(() => { 
                // }, 5000);
            }
        })();
    }, [props.projects]);

    const syncTreeViewSelection = (e) => {
        const treeViewConst = (e.component.selectItem && e.component)
            || (treeView && treeView.instance);

        if (treeViewConst) {
            if (e.value === null) {
                treeViewConst.unselectAll();
            } else {
                const values = e.value || treeBoxValue;
                values && values.forEach((value) => {
                    treeViewConst.selectItem(value);
                });
            }
        }

        if (e.value !== undefined) {
            props.onChangeFixedVersion(e.value);
            setTreeBoxValue(e.value);
        }
    }

    const treeViewItemSelectionChanged = async (e) => {
        console.log("bbb")
        setTreeBoxValue(e.component.getSelectedNodeKeys());
        let versionsPage2 = await getProjectVersions(listProject, 10, 10);
        console.log(versionsPage2.values)
        console.log(treeDataSource)
        versionsPage2 && treeDataSource.push(...versionsPage2.values);
        treeDataSourceStore.reload();
    }

    const treeViewRender = () => {
        return (
            <div
                style={{
                    border: '3px solid black',
                    // width: '400px',
                    height: '250px',
                    overflow: 'scroll',
                }}
                onScroll={(event) => {
                    const {
                        scrollTop,
                        scrollHeight,
                        clientHeight
                    } = event.currentTarget;
                    console.log(scrollTop);
                    console.log(scrollHeight);
                    console.log(clientHeight);
                }}
            >
                <TreeView
                    dataSource={treeDataSourceStore}
                    ref={(ref) => { treeView = ref; }}
                    dataStructure="plain"
                    keyExpr="id"
                    displayExpr="name"
                    selectionMode="multiple"
                    showCheckBoxesMode="normal"
                    selectByClick={true}
                    onContentReady={syncTreeViewSelection}
                    onItemSelectionChanged={treeViewItemSelectionChanged}
                />
            </div>
        );
    }

    return (
        <DropDownBox
            value={treeBoxValue}
            valueExpr="id"
            displayExpr="name"
            dataSource={treeDataSource}
            showClearButton={true}
            labelMode={"floating"}
            label='Select Fixed Versions'
            onValueChanged={syncTreeViewSelection}
            contentRender={treeViewRender}
        />
    )
}

export default FixedVersionMultiSelect;
