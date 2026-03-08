import React from 'react';
import SubmissionTracker from '../SubmissionTracker';
import { usePageTitle } from '@/contexts/PageContext';

const SubmissionPage: React.FC = () => {
    usePageTitle('我的投稿记录');

    return (
        <div className="submission-page-wrapper">
            <div className="page-wrapper" style={{ padding: '20px' }}>
                <SubmissionTracker />
            </div>
        </div>
    );
};

export default SubmissionPage;
