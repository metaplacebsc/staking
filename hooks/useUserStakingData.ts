import { useEffect, useMemo, useState } from 'react';
import useFeeClaimHistoryQuery from 'queries/staking/useFeeClaimHistoryQuery';
import useGetFeePoolDataQuery from 'queries/staking/useGetFeePoolDataQuery';
import useExchangeRatesQuery from 'queries/rates/useExchangeRatesQuery';
import useTotalIssuedSynthsExcludingEtherQuery from 'queries/synths/useTotalIssuedSynthsExcludingEtherQuery';
import useClaimableRewards from 'queries/staking/useClaimableRewardsQuery';
import useStakingCalculations from 'sections/staking/hooks/useStakingCalculations';
import { Synths } from 'constants/currency';
import { WEEKS_IN_YEAR } from 'constants/date';

import { toBigNumber } from 'utils/formatters/number';

export const useUserStakingData = () => {
	const [hasClaimed, setHasClaimed] = useState<boolean>(false);
	const history = useFeeClaimHistoryQuery();
	const currentFeePeriod = useGetFeePoolDataQuery('0');
	const exchangeRatesQuery = useExchangeRatesQuery();
	const totalIssuedSynthsExclEth = useTotalIssuedSynthsExcludingEtherQuery(Synths.sUSD);
	const previousFeePeriod = useGetFeePoolDataQuery('1');
	const { currentCRatio, targetCRatio, debtBalance, collateral } = useStakingCalculations();

	const sUSDRate = exchangeRatesQuery.data?.sUSD ?? 0;
	const feesToDistribute = previousFeePeriod?.data?.feesToDistribute ?? 0;
	const rewardsToDistribute = previousFeePeriod?.data?.rewardsToDistribute ?? 0;
	const totalsUSDDebt = totalIssuedSynthsExclEth?.data ?? 0;
	const SNXRate = exchangeRatesQuery.data?.SNX ?? 0;

	const stakedValue =
		collateral.toNumber() > 0 && currentCRatio.toNumber() > 0
			? collateral
					.multipliedBy(Math.min(1 / currentCRatio.dividedBy(targetCRatio).toNumber()))
					.multipliedBy(SNXRate)
			: toBigNumber(0);
	const weeklyRewards = sUSDRate * feesToDistribute + SNXRate * rewardsToDistribute;

	const stakingAPR =
		stakedValue.toNumber() > 0 && debtBalance.toNumber() > 0
			? (weeklyRewards * (debtBalance.toNumber() / totalsUSDDebt) * WEEKS_IN_YEAR) /
			  stakedValue.toNumber()
			: 0;

	const availableRewards = useClaimableRewards();

	const tradingRewards = availableRewards?.data?.tradingRewards ?? toBigNumber(0);
	const stakingRewards = availableRewards?.data?.stakingRewards ?? toBigNumber(0);

	const { currentFeePeriodStarts, nextFeePeriodStarts } = useMemo(() => {
		return {
			currentFeePeriodStarts: new Date(
				currentFeePeriod.data?.startTime ? currentFeePeriod.data.startTime * 1000 : 0
			),
			nextFeePeriodStarts: new Date(
				currentFeePeriod.data?.startTime
					? (currentFeePeriod.data.startTime + currentFeePeriod.data.feePeriodDuration) * 1000
					: 0
			),
		};
	}, [currentFeePeriod]);

	useEffect(() => {
		const checkClaimedStatus = () =>
			setHasClaimed(
				history.data
					? history.data?.some((tx) => {
							const claimedDate = new Date(tx.timestamp);
							return claimedDate > currentFeePeriodStarts && claimedDate < nextFeePeriodStarts;
					  })
					: false
			);
		checkClaimedStatus();
	}, [history, currentFeePeriodStarts, nextFeePeriodStarts]);

	return {
		hasClaimed,
		stakedValue,
		stakingAPR,
		tradingRewards,
		stakingRewards,
		debtBalance,
	};
};

export default useUserStakingData;
