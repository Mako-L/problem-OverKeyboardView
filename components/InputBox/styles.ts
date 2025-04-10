import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  containerTextInputWrapper: {
    justifyContent: "center",
    paddingTop: 0,
    bottom: 0,
    width: "100%",
  },
  inputBoxContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e1e1e1",
  },
  simpleShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  innerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  textArea: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    fontSize: 16,
  },
  buttonLeftWrapper: {
    marginRight: 10,
  },
  buttonRightWrapper: {
    marginLeft: 10,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  fileScrollView: {
    flexGrow: 0,
    marginBottom: 10,
  },
}); 