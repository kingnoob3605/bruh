import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  Image,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather, AntDesign } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const InventoryComponent = ({ inventory, setInventory }) => {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [selectedItems, setSelectedItems] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState(0);
  const [tempQuantity, setTempQuantity] = useState("");
  const intervalRef = useRef(null);

  const addItem = () => {
    if (newItemName.trim() !== "" && newItemQuantity.trim() !== "") {
      const quantity = parseInt(newItemQuantity, 10);
      if (isNaN(quantity)) {
        Alert.alert(
          "Invalid Input",
          "Please enter a valid number for quantity."
        );
        return;
      }
      setInventory((prevInventory) => ({
        ...prevInventory,
        [newItemName.trim()]: Math.min(quantity, 500),
      }));
      setNewItemName("");
      setNewItemQuantity("");
      setAddModalVisible(false);
    }
  };

  const removeItems = () => {
    const updatedInventory = { ...inventory };
    Object.keys(selectedItems).forEach((item) => {
      if (selectedItems[item]) {
        delete updatedInventory[item];
      }
    });
    setInventory(updatedInventory);
    setSelectedItems({});
    setRemoveModalVisible(false);
  };

  const startEditing = (item) => {
    setEditingItem(item);
    setEditingQuantity(inventory[item]);
    setTempQuantity(inventory[item].toString());
  };

  const stopEditing = () => {
    setEditingItem(null);
    setTempQuantity("");
    clearInterval(intervalRef.current);
  };

  const updateQuantity = (increment) => {
    setEditingQuantity((prevQuantity) => {
      const newQuantity = prevQuantity + increment;
      setTempQuantity(Math.max(0, Math.min(newQuantity, 500)).toString());
      return Math.max(0, Math.min(newQuantity, 500));
    });
  };

  const confirmQuantity = () => {
    if (editingItem) {
      const newQuantity = Math.max(
        0,
        Math.min(parseInt(tempQuantity, 10) || 0, 500)
      );
      setInventory((prevInventory) => ({
        ...prevInventory,
        [editingItem]: newQuantity,
      }));
      setEditingQuantity(newQuantity);
      stopEditing();
    }
  };

  const renderMenuItem = ({ item }) => (
    <View style={[styles.menuItem, { width: `${100 / numColumns}%` }]}>
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={styles.itemImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.itemImage, styles.placeholderImage]}>
          <Feather name="coffee" size={24} color={colors.secondary} />
        </View>
      )}
      <Text style={styles.itemName}>{item.name}</Text>
    </View>
  );

  const startContinuousUpdate = (increment) => {
    updateQuantity(increment);
    intervalRef.current = setInterval(() => updateQuantity(increment), 100);
  };

  const stopContinuousUpdate = () => {
    clearInterval(intervalRef.current);
  };

  const renderInventoryItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemNameContainer}>
        <Text style={styles.itemName}>{item}</Text>
        {editingItem === item ? (
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(-1)}
              onLongPress={() => startContinuousUpdate(-1)}
              onPressOut={stopContinuousUpdate}
            >
              <AntDesign name="minus" color={colors.text} size={20} />
            </TouchableOpacity>
            <TextInput
              style={styles.quantityInput}
              value={tempQuantity}
              onChangeText={(text) => {
                if (/^\d*$/.test(text)) {
                  setTempQuantity(text);
                } else {
                  Alert.alert("Invalid Input", "Please enter numbers only.");
                }
              }}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={confirmQuantity}
            />
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(1)}
              onLongPress={() => startContinuousUpdate(1)}
              onPressOut={stopContinuousUpdate}
            >
              <AntDesign name="plus" color={colors.text} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={confirmQuantity}
            >
              <AntDesign name="check" color={colors.white} size={20} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.countContainer}
            onPress={() => startEditing(item)}
          >
            <Text style={styles.countText}>{inventory[item]}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={Object.keys(inventory)}
        renderItem={renderInventoryItem}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={() => setAddModalVisible(true)}
        >
          <Feather name="coffee" color={colors.white} size={24} />
          <Text style={styles.actionButtonText}>Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => setRemoveModalVisible(true)}
        >
          <Feather name="trash-2" color={colors.white} size={24} />
          <Text style={styles.actionButtonText}>Remove Items</Text>
        </TouchableOpacity>
      </View>

      {/* Add Item Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.centeredView}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Add New Item</Text>
            <TextInput
              style={styles.input}
              onChangeText={setNewItemName}
              value={newItemName}
              placeholder="Enter item name"
              placeholderTextColor={colors.placeholderText}
            />
            <TextInput
              style={styles.input}
              onChangeText={(text) => {
                if (/^\d*$/.test(text)) {
                  setNewItemQuantity(text);
                } else {
                  Alert.alert("Invalid Input", "Please enter numbers only.");
                }
              }}
              value={newItemQuantity}
              placeholder="Enter quantity"
              placeholderTextColor={colors.placeholderText}
              keyboardType="number-pad"
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={addItem}
              >
                <Text style={styles.textStyle}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Remove Items Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={removeModalVisible}
        onRequestClose={() => setRemoveModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Remove Items</Text>
            <ScrollView style={styles.removeItemsScrollView}>
              <FlatList
                data={Object.keys(inventory)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() =>
                      setSelectedItems((prev) => ({
                        ...prev,
                        [item]: !prev[item],
                      }))
                    }
                  >
                    <View
                      style={[
                        styles.checkbox,
                        selectedItems[item] && styles.checkboxChecked,
                      ]}
                    >
                      {selectedItems[item] && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.checkboxTitle}>{item}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item}
              />
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setRemoveModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={removeItems}
              >
                <Text style={styles.textStyle}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width } = Dimensions.get("window");
const buttonWidth = Math.min(width * 0.8, 300);

const colors = {
  primary: "#6F4E37",
  secondary: "#C4A484",
  background: "#FFF8E7",
  text: "#3C2F2F",
  accent: "#FFDB58",
  white: "#FFFFFF",
  danger: "#e74c3c",
  success: "#2ecc71",
  info: "#3498db",
  fabBackground: "#FF4081",
  border: "#D2B48C",
  placeholderText: "#999999",
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  itemNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    color: colors.text,
    flex: 1,
  },
  countContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    padding: 8,
    backgroundColor: colors.secondary,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  quantityInput: {
    width: 40,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  confirmButton: {
    backgroundColor: colors.success,
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  actionButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 8,
    boxShadow: "0px 2px 3px rgba(0, 0, 0, 0.2)",
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  removeButton: {
    backgroundColor: colors.danger,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 5,
    padding: 15,
    width: "100%",
    marginBottom: 20,
    fontSize: 16,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  button: {
    borderRadius: 10,
    padding: 15,
    boxShadow: "0px 2px 2px rgba(0, 0, 0, 0.25)",
    width: buttonWidth / 2 - 10,
    alignItems: "center",
  },
  buttonClose: {
    backgroundColor: colors.danger,
  },
  buttonSave: {
    backgroundColor: colors.success,
  },
  textStyle: {
    color: colors.white,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  checkboxTitle: {
    fontSize: 16,
    color: colors.text,
  },
  removeItemsScrollView: {
    maxHeight: 300,
    width: "100%",
  },
});

export default InventoryComponent;
