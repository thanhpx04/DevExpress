import React, { useEffect, useState } from 'react';
import { Calendar } from 'devextreme-react/calendar';
import { DropDownBox, DropDownOptions } from 'devextreme-react/drop-down-box';
import { formatDate } from "devextreme/localization";
import { TextBox } from 'devextreme-react/text-box';

const DateRange = (props) => {

    let [startDate, setStartDate] = useState(new Date);
    let [endDate, setEndDate] = useState(new Date);

    return (
        <DropDownBox
            value={[startDate, endDate]}
            label="Create Date"
            labelMode={"floating"}
            fieldRender={(value, fieldElement) => {
                const formattedText = value.map(value => formatDate(value, "dd/MM/yyyy")).join(" - ");

                return (
                    <div>
                        <TextBox
                            readOnly={true}
                            value={formattedText}
                        />
                    </div>
                );
            }}
            contentRender={(component) => {
                const dropDownBox = component;
                let dateRange = dropDownBox.value;

                return (
                    <Calendar
                        value={dateRange[dateRange.length - 1]}
                        cellRender={(cellInfo, index, container) => {
                            let cssClass = '';
                            const cellDate = cellInfo.date;
                            dateRange = dropDownBox.value;

                            let createFrom = new Date(dateRange[0]);
                            let createTo = new Date(dateRange[1]);
                            createFrom.setHours(0,0,0,0)
                            createTo.setHours(0,0,0,0)

                            if (cellDate >= createFrom && cellDate <= createTo) {
                                cssClass = 'selected';
                            }

                            return (
                                <span className={cssClass}>
                                    {cellInfo.text}
                                </span>
                            );
                        }}
                        onValueChanged={({ component, value }) => {
                            const calendar = component;
                            dateRange = dropDownBox.value;
                            
                            if (dateRange.length >= 2 || value < dateRange[0]) dateRange = [];
                            
                            dateRange.push(value);
                            dropDownBox.value = dateRange;
                            
                            calendar.repaint();
                            calendar.focus();
                            
                            if (dateRange.length == 2) {
                                setStartDate(dateRange[0]);
                                setEndDate(dateRange[1]);
                                props.onChangeCreateDate(dateRange);
                                
                                dropDownBox.component.close();
                                dropDownBox.component.focus();
                            }
                        }}
                    >
                    </Calendar>
                )
            }}
        >
            <DropDownOptions
                width="auto" // need to display calendar fully
            />
        </DropDownBox>

    );
}

export default DateRange;