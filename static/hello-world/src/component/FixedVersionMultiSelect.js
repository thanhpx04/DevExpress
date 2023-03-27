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

    const onScrollHandler = async (event) => {
        const {
            scrollTop,
            scrollHeight,
            clientHeight
        } = event.currentTarget;

        if (scrollTop + clientHeight >= scrollHeight - 5 && hasMoreData(currentPage, limit, total)) {
            const startAt = (currentPage - 1) * limit + 1;
            let versions = await getProjectVersions(listProject, startAt, limit);
            console.log("aa")

            if (versions) {
                treeDataSource.push(...versions.values);
                treeDataSourceStore.reload();
                console.log(treeDataSource)
            }
        }
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
