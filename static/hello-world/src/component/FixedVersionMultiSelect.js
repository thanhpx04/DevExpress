import React, { useEffect, useState } from 'react';
import { getProjectVersions } from "../data/ManageData";
import TreeView from 'devextreme-react/tree-view';
import DropDownBox from 'devextreme-react/drop-down-box';
import CustomStore from 'devextreme/data/data_source';
import * as Constants from '../utility/Constants';

const FixedVersionMultiSelect = (props) => {

    let [treeBoxValue, setTreeBoxValue] = useState([]);
    let [treeDataSource, setTreeDataSource] = useState([]);
    let treeView = null;
    let listProject = props.projects;

    // control variables
    let currentPage = 1;
    const limit = Constants.DROPDOWN_LIMIT;
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
        setTreeBoxValue(e.component.getSelectedNodeKeys());
    }

    const hasMoreData = (page, limit, total) => {
        const startIndex = (page - 1) * limit + 1;
        return total === 0 || startIndex < total;
    };

    const onScrollHandler = (event) => {
        const {
            scrollTop,
            scrollHeight,
            clientHeight
        } = event.currentTarget;

        if (scrollTop + clientHeight >= scrollHeight - 5 && hasMoreData(currentPage, limit, total)) {
            currentPage++;
            console.log("aa")
            const startAt = (currentPage - 1) * limit + 1;
            getProjectVersions(listProject, startAt, limit).then((versions) => {
                if (versions && versions.values.length > 0) {
                    if(!treeDataSource.find(x => x.id === versions.values[0].id)){
                        console.log("bb")
                        treeDataSource.push(...versions.values);
                        treeDataSourceStore.reload();

                    }
                }
              });
        }
    };

    const treeViewRender = () => {
        return (
            <div
                style={{
                    height: '250px',
                    overflow: 'scroll',
                }}
                onScroll={onScrollHandler}
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

    useEffect(() => {
        (async () => {
            if (listProject && listProject.length > 0) {
                const startAt = (currentPage - 1) * limit + 1;
                let versions = await getProjectVersions(listProject, startAt, limit);

                if (versions) {
                    console.log("ff")
                    // update the total
                    total = versions.total;
                    setTreeDataSource(versions.values);
                    treeDataSourceStore.load();
                    setTreeBoxValue([]);
                }
            }
        })();
    }, [props.projects]);

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
