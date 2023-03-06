import React, { useEffect, useState } from 'react';
import { getProjectVersions } from "../data/ManageData";
import TreeView from 'devextreme-react/tree-view';
import DropDownBox from 'devextreme-react/drop-down-box';

const FixedVersionMultiSelect = (props) => {

    let [treeBoxValue, setTreeBoxValue] = useState([]);
    let [treeDataSource, setTreeDataSource] = useState([]);
    let treeView = null;

    useEffect(() => {
        (async () => {
            if (props.projects) {
                let listProject = props.projects;
                let versions = await getProjectVersions(listProject);
                setTreeDataSource(versions);
                setTreeBoxValue([]);
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

    const treeViewItemSelectionChanged = (e) => {
        setTreeBoxValue(e.component.getSelectedNodeKeys());
    }

    const treeViewRender = () => {
        return (
            <TreeView
                dataSource={treeDataSource}
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
