import { FC, useEffect } from 'react';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { LineSpacer } from 'styles/common';
import UIContainer from 'containers/UI';
import TransactionsContainer from 'sections/history/TransactionsContainer';
import StatsSection from 'components/StatsSection';

import StatBox from 'components/StatBox';
import { useRecoilValue } from 'recoil';
import { walletAddressState } from 'store/wallet';
import { StakingTransactionType } from 'sections/history/types';
import sortBy from 'lodash/sortBy';

import useSynthetixQueries from '@synthetixio/queries';

const HistoryPage: FC = () => {
	const { t } = useTranslation();

	const walletAddress = useRecoilValue(walletAddressState);

	const { issuance } = useSynthetixQueries();
	const issues = issuance.useGetIssueds(
		{
			first: 1000,
			orderBy: 'timestamp',
			orderDirection: 'desc',
			where: { account: walletAddress?.toLowerCase() },
		},
		{ id: true, timestamp: true, value: true }
	);
	const burns = issuance.useGetBurneds(
		{
			first: 1000,
			orderBy: 'timestamp',
			orderDirection: 'desc',
			where: { account: walletAddress?.toLowerCase() },
		},
		{ id: true, timestamp: true, value: true }
	);
	const feeClaims = issuance.useGetFeesClaimeds(
		{
			first: 1000,
			orderBy: 'timestamp',
			orderDirection: 'desc',
			where: { account: walletAddress?.toLowerCase() },
		},
		{ id: true, timestamp: true, rewards: true, value: true }
	);

	const { setTitle } = UIContainer.useContainer();

	const isLoaded = issues.isSuccess && burns.isSuccess && feeClaims.isSuccess;

	const history = isLoaded
		? sortBy(
				[
					issues.data!.map((d) => ({
						type: StakingTransactionType.Issued,
						hash: d.id.split('-')[0],
						...d,
					})),
					burns.data!.map((d) => ({
						type: StakingTransactionType.Burned,
						hash: d.id.split('-')[0],
						...d,
					})),
					feeClaims.data!.map((d) => ({
						type: StakingTransactionType.FeesClaimed,
						hash: d.id.split('-')[0],
						...d,
					})),
				].flat(),
				(d) => -d.timestamp.toNumber()
		  )
		: [];

	const txCount = history.length;

	// header title
	useEffect(() => {
		setTitle('wallet', 'history');
	}, [setTitle]);

	return (
		<>
			<Head>
				<title>{t('history.page-title')}</title>
			</Head>
			<StatsSection>
				<div />
				<TxCount title={t('common.stat-box.tx-count')} value={txCount} size="lg" />
				<div />
			</StatsSection>
			<LineSpacer />
			<TransactionsContainer history={history} isLoaded={isLoaded} />
		</>
	);
};

const TxCount = styled(StatBox)`
	.value {
		text-shadow: ${(props) => props.theme.colors.blueTextShadow};
		color: ${(props) => props.theme.colors.black};
	}
`;

export default HistoryPage;
