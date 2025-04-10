import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    position: 'relative',
  },
  header: {
    height: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  headerButton: {
    padding: 10,
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: -1,
  },
  backgroundImage: {
    position: "absolute",
    opacity: 0.1,
  },
  fullScreen: {
    flex: 1,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0, 128, 0, 0.3)",
  },
  background: {
    width: 200,
    height: 200,
    backgroundColor: "blue",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  buttonContainer: {
    backgroundColor: "#007AFF",
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: 'red',
    width: '100%',
    height: 40,
    zIndex: 1000,
    elevation: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 5,
  },
  complexButtonsWrapper: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  drawerButton: {
    backgroundColor: '#ddd',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
}); 