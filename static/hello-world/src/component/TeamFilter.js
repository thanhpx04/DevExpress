import React, { useEffect, useState } from 'react';
import { getTeams } from "../data/ManageData";
import SelectBox from 'devextreme-react/select-box';

const TeamFilter = (props) => {

    let [value, setValue] = useState(props.value);
    let [dataSource, setDataSource] = useState([]);

    useEffect(() => {
        (async () => {
            let teams = await getTeams();
            setDataSource(teams);
            setValue("");
        })();
    }, []);

    const onSelectionChanged = (value) => {
        props.onChangeTeam(value.selectedItem);
        setValue(value.selectedItem);
    };

    return (
        <SelectBox
            value={value}
            displayExpr="title"
            dataSource={dataSource}
            labelMode={"floating"}
            label='Select Team'
            onSelectionChanged={onSelectionChanged}
        />
    );
}

export default TeamFilter;
