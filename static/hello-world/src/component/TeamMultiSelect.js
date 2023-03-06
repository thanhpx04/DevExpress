import React, { useEffect, useState } from 'react';
import { getTeams } from "../data/ManageData";
import DropDownBox from 'devextreme-react/drop-down-box';
import TreeView from 'devextreme-react/tree-view';

const TeamMultiSelect = (props) => {

    let [treeBoxValue, setTreeBoxValue] = useState([]);
    let [treeDataSource, setTreeDataSource] = useState([]);
    let treeView = null;
  
    useEffect(() => {
      (async () => {
        let teams = await getTeams();
        setTreeDataSource(teams);
      })();
    }, []);
  
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
        props.onChangeTeams(e.value);
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
          displayExpr="title"
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
        displayExpr="title"
        dataSource={treeDataSource}
        showClearButton={true}
        labelMode={"floating"}
        label='Select Team'
        onValueChanged={syncTreeViewSelection}
        contentRender={treeViewRender}
      />
    )
}

export default TeamMultiSelect;
