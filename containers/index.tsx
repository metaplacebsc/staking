import { FC, ReactNode } from 'react';

import Connector from './Connector';
import BlockExplorer from './BlockExplorer';
import TransactionNotifier from './TransactionNotifier';
import Loans from './Loans';
import SideNav from './UI';

type WithAppContainersProps = {
	children: ReactNode;
};

export const WithAppContainers: FC<WithAppContainersProps> = ({ children }) => (
	<SideNav.Provider>
		<Connector.Provider>
			<BlockExplorer.Provider>
				<TransactionNotifier.Provider>
					<Loans.Provider>{children}</Loans.Provider>
				</TransactionNotifier.Provider>
			</BlockExplorer.Provider>
		</Connector.Provider>
	</SideNav.Provider>
);

export default WithAppContainers;
