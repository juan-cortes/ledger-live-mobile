// @flow
import { StyleSheet, Platform } from "react-native";
import colors from "../colors";

let headerStyle = {};
let headerStyleShadow = {};

if (Platform.OS === "ios") {
  headerStyle = {
    borderBottomWidth: 0,
  };
  headerStyleShadow = {
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: {
      height: 4,
    },
  };
} else {
  headerStyle = {
    elevation: 0,
  };
  headerStyleShadow = {
    borderBottomWidth: 1,
  };
}

function Styles() {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.lightGrey,
    },
    header: {
      ...headerStyle,
      ...headerStyleShadow,
    },
    headerNoShadow: {
      ...headerStyle,
    },
    bottomTabBar: {
      borderTopColor: colors.lightFog,
      backgroundColor: colors.white,
    },
    transparentHeader: {
      backgroundColor: "transparent",
      shadowOpacity: 0,
      elevation: 0,
    },
    labelStyle: { fontSize: 12 },
  });
}

export default Styles();
