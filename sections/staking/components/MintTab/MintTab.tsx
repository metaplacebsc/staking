import React, { useEffect, useMemo, useState } from 'react';

import UIContainer from 'containers/UI';

import useStakingCalculations from 'sections/staking/hooks/useStakingCalculations';
import { TabContainer } from '../common';
import MintTiles from '../MintTiles';
import StakingInput from '../StakingInput';
import { getMintAmount } from '../helper';
import { useRecoilState, useRecoilValue } from 'recoil';
import { amountToMintState, MintActionType, mintTypeState } from 'store/staking';
import { delegateWalletState } from 'store/wallet';
import { parseSafeWei } from 'utils/parse';
import Wei, { wei } from '@synthetixio/wei';
import useSynthetixQueries from '@synthetixio/queries';

const MintTab: React.FC = () => {
	const delegateWallet = useRecoilValue(delegateWalletState);

	const { useSynthetixTxn } = useSynthetixQueries();

	const [mintType, onMintTypeChange] = useRecoilState(mintTypeState);
	const [amountToMint, onMintChange] = useRecoilState(amountToMintState);

	const { targetCRatio, SNXRate, unstakedCollateral } = useStakingCalculations();

	const [gasPrice, setGasPrice] = useState<Wei>(wei(0));
	const [txModalOpen, setTxModalOpen] = useState<boolean>(false);

	const { setTitle } = UIContainer.useContainer();

	const isMax = mintType === MintActionType.MAX;

	const amountToMintBN = Wei.max(wei(0), parseSafeWei(amountToMint, wei(0)));

	const mintCall: [string, any[]] = !!delegateWallet
		? isMax
			? ['issueMaxSynthsOnBehalf', [delegateWallet.address]]
			: ['issueSynthsOnBehalf', [delegateWallet.address, amountToMintBN.toBN()]]
		: isMax
		? ['issueMaxSynths', []]
		: ['issueSynths', [amountToMintBN.toBN()]];

	const txn = useSynthetixTxn('Synthetix', mintCall[0], mintCall[1], {
		gasPrice: gasPrice.toBN(),
	});

	let error: string | null = null;

	useEffect(() => {
		if (txn.txnStatus === 'prompting') setTxModalOpen(true);
	}, [txn.txnStatus]);

	// header title
	useEffect(() => {
		setTitle('staking', 'mint');
	}, [setTitle]);

	const returnPanel = useMemo(() => {
		let onSubmit;
		let inputValue = '0';
		let isLocked;
		switch (mintType) {
			case MintActionType.MAX:
				inputValue = getMintAmount(targetCRatio, unstakedCollateral, SNXRate).toString();
				onMintChange(inputValue);
				onSubmit = () => txn.mutate();
				isLocked = true;
				break;
			case MintActionType.CUSTOM:
				onSubmit = () => txn.mutate();
				isLocked = false;
				inputValue = amountToMint;
				break;
			default:
				return <MintTiles />;
		}
		return (
			<StakingInput
				onSubmit={onSubmit}
				inputValue={inputValue}
				isLocked={isLocked}
				isMint={true}
				onBack={onMintTypeChange}
				error={error || txn.errorMessage}
				txModalOpen={txModalOpen}
				setTxModalOpen={setTxModalOpen}
				gasLimitEstimate={txn.gasLimit}
				setGasPrice={setGasPrice}
				onInputChange={onMintChange}
				txHash={txn.hash}
				transactionState={txn.txnStatus}
				resetTransaction={() => {
					txn.refresh();
					setTxModalOpen(false);
				}}
			/>
		);
	}, [
		mintType,
		error,
		txModalOpen,
		SNXRate,
		onMintChange,
		onMintTypeChange,
		targetCRatio,
		unstakedCollateral,
		txn,
		amountToMint,
	]);

	return <TabContainer>{returnPanel}</TabContainer>;
};

export default MintTab;
