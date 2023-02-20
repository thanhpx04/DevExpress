import React from 'react';
import { router } from '@forge/bridge';

export function BlockerCell(options) {
    const blockerList = options.data.blockers;
    if (!blockerList) {
        return <span className="name"></span>;
    }

    const openInNewTab = (e) => {
        e.preventDefault();
        const href = e.target.getAttribute('href');
        router.open(`/browse/${href}`);
    }

    return (
        <React.Fragment>
            {blockerList.map(item => (
                <p><span className="name">
                    <a href={item.key} target="_blank" onClick={openInNewTab} >
                        {item.key}
                    </a>
                </span></p>
            ))}
        </React.Fragment>
    );
}

export function FixVersionCell(options) {
    const fixVersionsList = options.data.fixVersions;
    if (!fixVersionsList) {
        return <span className="name"></span>;
    }

    return (
        <React.Fragment>
            {fixVersionsList.map(item => (
                <span className="name">
                    {item.name}&#44; 
                </span>
            ))}
        </React.Fragment>
    );
}
