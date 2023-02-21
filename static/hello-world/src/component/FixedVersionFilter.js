import React, { useEffect, useState } from 'react';
import { getProjectVersions } from "../data/ManageData";
import SelectBox from 'devextreme-react/select-box';
import DropDownBox from 'devextreme-react/drop-down-box';

const FixedVersionFilter = (props) => {
    
    let [value, setValue] = useState(props.value);
    let [dataSource, setDataSource] = useState([]);

    useEffect(() => {
        (async () => {
            if(props.projects){
                let listProjectKeys = props.projects.key;
                let versions = await getProjectVersions(listProjectKeys);
                setDataSource(versions);
                setValue("");
            }
        })();
    }, [props.projects]);

    const onSelectionChanged = (value) => {
        props.onChangeFixedVersion(value.selectedItem);
        setValue(value.selectedItem);
    };

    return (
        <SelectBox
            value={value}
            displayExpr="name"
            dataSource={dataSource}
            labelMode={"floating"}
            label='Select Fixed Versions'
            onSelectionChanged={onSelectionChanged}
        />
    );
}

export default FixedVersionFilter;
