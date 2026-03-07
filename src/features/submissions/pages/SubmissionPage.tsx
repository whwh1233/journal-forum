import React from 'react';
import SubmissionTracker from '../SubmissionTracker';
import PageHeader from '../../../components/layout/PageHeader';

const SubmissionPage: React.FC = () => {
    return (
        <div className="submission-page-wrapper">
            <PageHeader title="我的投稿记录" />
            <div className="page-wrapper" style={{ padding: '20px' }}>
                <SubmissionTracker />
            </div>
        </div>
    );
};

export default SubmissionPage;
