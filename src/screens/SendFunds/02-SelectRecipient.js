/* @flow */
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types";
import i18next from "i18next";
import React, { useCallback, useMemo } from "react";
import { Trans, translate } from "react-i18next";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import type { NavigationScreenProp } from "react-navigation";
import { SafeAreaView } from "react-navigation";
import { connect } from "react-redux";
import { compose } from "redux";
import { track, TrackScreen } from "../../analytics";
import SyncOneAccountOnMount from "../../bridge/SyncOneAccountOnMount";
import SyncSkipUnderPriority from "../../bridge/SyncSkipUnderPriority";
import colors from "../../colors";
import Button from "../../components/Button";
import KeyboardView from "../../components/KeyboardView";
import LText, { getFontStyle } from "../../components/LText";
import StepHeader from "../../components/StepHeader";
import TextInput from "../../components/TextInput";
import TranslatedError from "../../components/TranslatedError";
import { accountAndParentScreenSelector } from "../../reducers/accounts";
import type { T } from "../../types/common";

const forceInset = { bottom: "always" };

type Props = {
  account: AccountLike,
  parentAccount: ?Account,
  navigation: NavigationScreenProp<{
    params: {
      accountId: string,
      parentId: string,
      transaction: *,
      justScanned?: boolean,
    },
  }>,
  t: T,
};

const SendSelectRecipient = ({
  account,
  parentAccount,
  navigation,
  t,
}: Props) => {
  const {
    transaction,
    setAccount,
    setTransaction,
    status,
    bridgePending,
    bridgeError,
  } = useBridgeTransaction();

  useMemo(() => setAccount(account, parentAccount), [
    account,
    parentAccount,
    setAccount,
  ]);

  const onRecipientFieldFocus = useCallback(() => {
    track("SendRecipientFieldFocused");
  }, []);

  const onPressScan = useCallback(() => {
    navigation.navigate("ScanRecipient", {
      accountId: navigation.getParam("accountId"),
      parentId: navigation.getParam("parentId"),
    });
  }, [navigation]);

  const onChangeText = useCallback(
    recipient => {
      const bridge = getAccountBridge(account, parentAccount);
      setTransaction(bridge.updateTransaction(transaction, { recipient }));
    },
    [account, parentAccount, setTransaction, transaction],
  );
  const clear = () => onChangeText("");

  const onPressContinue = useCallback(async () => {
    if (!account) return;

    navigation.navigate("SendAmount", {
      accountId: account.id,
      parentId: parentAccount && parentAccount.id,
      transaction,
    });
  }, [account, parentAccount, navigation, transaction]);

  const input = React.createRef();

  if (!account || !transaction) return null;

  if (navigation.getParam("justScanned")) {
    delete navigation.state.params.justScanned;
    setTransaction(navigation.getParam("transaction"));
  }

  const {
    errors: { recipient: recipientError },
    warnings: { recipient: recipientWarning },
  } = status;

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <TrackScreen category="SendFunds" name="SelectRecipient" />
      <SyncSkipUnderPriority priority={100} />
      <SyncOneAccountOnMount priority={100} accountId={account.id} />
      <KeyboardView style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Button
            event="SendRecipientQR"
            type="tertiary"
            title={<Trans i18nKey="send.recipient.scan" />}
            IconLeft={IconQRCode}
            onPress={onPressScan}
          />
          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <LText style={styles.separatorText}>
              {<Trans i18nKey="common.or" />}
            </LText>
            <View style={styles.separatorLine} />
          </View>
          <View style={styles.inputWrapper}>
            {/* make this a recipient component */}
            <TextInput
              placeholder={t("send.recipient.input")}
              placeholderTextColor={colors.fog}
              style={[
                styles.addressInput,
                recipientError && styles.invalidAddressInput,
                recipientWarning && styles.warning,
              ]}
              onFocus={onRecipientFieldFocus}
              onChangeText={onChangeText}
              onInputCleared={clear}
              value={transaction.recipient}
              ref={input}
              multiline
              blurOnSubmit
              autoCapitalize="none"
              clearButtonMode="always"
            />
          </View>
          {!!transaction.recipient &&
            (recipientError || recipientWarning || bridgeError) && (
              <LText
                style={[
                  styles.warningBox,
                  recipientError || bridgeError ? styles.error : styles.warning,
                ]}
              >
                <TranslatedError
                  error={recipientError || recipientWarning || bridgeError}
                />
              </LText>
            )}
        </ScrollView>
        <View style={[styles.container, styles.containerFlexEnd]}>
          <Button
            event="SendRecipientContinue"
            type="primary"
            title={<Trans i18nKey="common.continue" />}
            disabled={
              bridgePending ||
              !!recipientError ||
              !!recipientWarning ||
              !!bridgeError
            }
            pending={bridgePending}
            onPress={onPressContinue}
          />
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
};

SendSelectRecipient.navigationOptions = {
  headerTitle: (
    <StepHeader
      title={i18next.t("send.stepperHeader.recipientAddress")}
      subtitle={i18next.t("send.stepperHeader.stepRange", {
        currentStep: "2",
        totalSteps: "6",
      })}
    />
  ),
};

const IconQRCode = ({ size, color }: { size: number, color: string }) => (
  <Icon name="qrcode" size={size} color={color} />
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  a: {},
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  separatorContainer: {
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  separatorLine: {
    flex: 1,
    borderBottomColor: colors.lightFog,
    borderBottomWidth: 1,
    marginHorizontal: 8,
  },
  separatorText: {
    color: colors.grey,
  },
  containerFlexEnd: {
    flex: 1,
    justifyContent: "flex-end",
  },
  addressInput: {
    flex: 1,
    color: colors.darkBlue,
    ...getFontStyle({ semiBold: true }),
    fontSize: 20,
    paddingVertical: 16,
  },
  invalidAddressInput: {
    color: colors.alert,
  },
  warning: {
    color: colors.orange,
  },
  warningBox: {
    marginTop: 8,
    ...Platform.select({
      android: {
        marginLeft: 6,
      },
    }),
  },
  error: {
    color: colors.alert,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default compose(
  translate(),
  connect(accountAndParentScreenSelector),
)(SendSelectRecipient);
