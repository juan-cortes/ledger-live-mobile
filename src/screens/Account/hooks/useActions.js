/* @flow */
import React from "react";
import type { AccountLike, Account } from "@ledgerhq/live-common/lib/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/lib/account";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { NavigatorName, ScreenName } from "../../../const";
import {
  readOnlyModeEnabledSelector,
  swapSupportedCurrenciesSelector,
} from "../../../reducers/settings";
import perFamilyAccountActions from "../../../generated/accountActions";
import { isCurrencySupported } from "../../Exchange/coinifyConfig";
import Swap from "../../../icons/Swap";
import Lending from "../../../icons/Lending";
import Exchange from "../../../icons/Exchange";

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  colors: *,
};

export default function useActions({ account, parentAccount, colors }: Props) {
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const availableOnSwap = useSelector(state =>
    swapSupportedCurrenciesSelector(state, { accountId: account.id }),
  );
  const mainAccount = getMainAccount(account, parentAccount);
  const decorators = perFamilyAccountActions[mainAccount.currency.family];
  const currency = getAccountCurrency(account);

  const accountId = account.id;

  const availableOnCompound =
    account.type === "TokenAccount" && !!account.compoundBalance;

  const canBeBought = isCurrencySupported(currency);

  const baseActions =
    (decorators &&
      decorators.getActions &&
      decorators.getActions({
        account,
        parentAccount,
        colors,
      })) ||
    [];

  const actions = [
    ...baseActions,
    ...(!readOnlyModeEnabled && canBeBought
      ? [
          {
            navigationParams: [NavigatorName.Exchange, { accountId }],
            label: <Trans i18nKey="account.buy" />,
            Icon: Exchange,
            event: "Buy Crypto Account Button",
            eventProperties: {
              currencyName: currency.name,
            },
          },
        ]
      : []),
    // Add in sell and more feature flagging logic here
    ...(availableOnSwap.includes(currency)
      ? [
          {
            navigationParams: [
              NavigatorName.Swap,
              {
                screen: ScreenName.SwapFormOrHistory,
                params: {
                  defaultAccount: account,
                  defaultParentAccount: parentAccount,
                },
              },
            ],
            label: (
              <Trans
                i18nKey="transfer.swap.main.header"
                values={{ currency: currency.name }}
              />
            ),
            Icon: Swap,
            event: "Swap Crypto Account Button",
            eventProperties: { currencyName: currency.name },
          },
        ]
      : []),
    ...(availableOnCompound
      ? [
          {
            enableActions: "lending",
            label: (
              <Trans
                i18nKey="transfer.lending.actionTitle"
                values={{ currency: currency.name }}
              />
            ),
            Icon: Lending,
            event: "Lend Crypto Account Button",
            eventProperties: { currencyName: currency.name },
          },
        ]
      : []),
  ];

  return actions;
}
