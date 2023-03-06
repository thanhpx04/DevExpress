import { useEffect, useState } from "react";
import SelectBox from 'devextreme-react/select-box';
import { getIssueLinkType } from "../data/ManageData";

const LinkTypeSingleSelect = (props) => {

    let [value, setValue] = useState();
    let [dataSource, setDataSource] = useState([]);

    useEffect(() => {
        (async () => {
            let linkTypes = await getIssueLinkType();
            setDataSource(linkTypes);
            // setValue("");
        })();
    }, []);

    const onSelectionChanged = (value) => {
        props.onChangeLinkType(value.selectedItem);
        setValue(value.selectedItem);
    };
    
    return (
        <SelectBox
            value={value}
            displayExpr="name"
            dataSource={dataSource}
            labelMode={"floating"}
            label='Select Link Type'
            onSelectionChanged={onSelectionChanged}
        />
    );
};
export default LinkTypeSingleSelect;