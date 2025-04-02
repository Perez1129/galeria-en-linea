import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Alert,
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { Ionicons } from "@expo/vector-icons"
import { fetchImages, uploadImage, deleteImage } from "./api"

export default function App() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [uploadPreviewVisible, setUploadPreviewVisible] = useState(false)
  const [imageToUpload, setImageToUpload] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [currentResolution, setCurrentResolution] = useState("500px")

  const windowWidth = Dimensions.get("window").width
  const numColumns = windowWidth > 600 ? 3 : 2

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    try {
      setLoading(true)
      const data = await fetchImages()
      setImages(data || [])
    } catch (error) {
      console.error("Error al cargar imágenes:", error)
      Alert.alert("Error", "No se pudieron cargar las imágenes")
    } finally {
      setLoading(false)
    }
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Necesitamos permisos para acceder a la galería")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageToUpload(result.assets[0])
      setUploadPreviewVisible(true)
    }
  }

  const handleUploadImage = async () => {
    if (!imageToUpload) return

    setLoading(true)

    try {
      const result = await uploadImage(imageToUpload.uri)

      if (result) {
        // Recargar las imágenes después de subir una nueva
        await loadImages()
      }

      setUploadPreviewVisible(false)
      setImageToUpload(null)
    } catch (error) {
      console.error("Error al subir imagen:", error)
      Alert.alert("Error", "No se pudo subir la imagen")
    } finally {
      setLoading(false)
    }
  }

interface ImageItem {
    id?: string;
    _id?: string;
    uri: string;
    resolutions?: {
        [key: string]: string;
    };
}

const handleDeleteImage = async (id: string) => {
    setLoading(true);

    try {
        await deleteImage(id);

        // Recargar las imágenes después de eliminar
        await loadImages();
        setPreviewVisible(false);
    } catch (error) {
        console.error("Error al eliminar imagen:", error);
        Alert.alert("Error", "No se pudo eliminar la imagen");
    } finally {
        setLoading(false);
    }
};

  const renderItem = ({ item }: { item: ImageItem }) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => {
        setSelectedImage(item)
        setPreviewVisible(true)
      }}
    >
      <Image
        source={{
          uri: item.resolutions ? item.resolutions[currentResolution] || item.uri : item.uri,
        }}
        style={styles.image}
        resizeMode="cover"
      />
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => {
          setSelectedImage(item)
          setPreviewVisible(true)
        }}
      >
        <Text style={styles.viewButtonText}>Ver</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Galería de Imágenes</Text>
        <View style={styles.resolutionSelector}>
          <Text style={styles.resolutionText}>Resolución: </Text>
          <TouchableOpacity
            style={[styles.resolutionButton, currentResolution === "250px" && styles.activeResolution]}
            onPress={() => setCurrentResolution("250px")}
          >
            <Text style={styles.resolutionButtonText}>250px</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resolutionButton, currentResolution === "500px" && styles.activeResolution]}
            onPress={() => setCurrentResolution("500px")}
          >
            <Text style={styles.resolutionButtonText}>500px</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resolutionButton, currentResolution === "750px" && styles.activeResolution]}
            onPress={() => setCurrentResolution("750px")}
          >
            <Text style={styles.resolutionButtonText}>750px</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Ionicons name="cloud-upload-outline" size={24} color="white" />
          <Text style={styles.uploadButtonText}>Subir Imagen</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : (
        <FlatList
          data={images}
          renderItem={renderItem}
          keyExtractor={(item) => item.id || item._id || String(Math.random())}
          numColumns={numColumns}
          contentContainerStyle={styles.imageGrid}
          refreshing={loading}
          onRefresh={loadImages}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay imágenes disponibles</Text>
            </View>
          }
        />
      )}

      {/* Modal de Vista Previa de Imagen */}
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedImage && (
              <Image
                source={{
                  uri: selectedImage.resolutions
                    ? selectedImage.resolutions[currentResolution] || selectedImage.uri
                    : selectedImage.uri,
                }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setPreviewVisible(false)}>
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={() => {
                  const id = selectedImage?.id || selectedImage?._id;
                  if (id) {
                    handleDeleteImage(id);
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Vista Previa de Carga */}
      <Modal
        visible={uploadPreviewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUploadPreviewVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {imageToUpload && (
              <Image source={{ uri: imageToUpload.uri }} style={styles.previewImage} resizeMode="contain" />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setUploadPreviewVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.uploadModalButton]} onPress={handleUploadImage}>
                <Text style={styles.modalButtonText}>Subir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  resolutionSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  resolutionText: {
    color: "#fff",
    marginRight: 8,
  },
  resolutionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#333",
    borderRadius: 4,
    marginRight: 8,
  },
  activeResolution: {
    backgroundColor: "#007bff",
  },
  resolutionButtonText: {
    color: "#fff",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 4,
    justifyContent: "center",
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageGrid: {
    padding: 8,
  },
  imageContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    aspectRatio: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  viewButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 8,
    alignItems: "center",
  },
  viewButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#111",
    borderRadius: 8,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#000",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    backgroundColor: "#333",
    minWidth: 100,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  uploadModalButton: {
    backgroundColor: "#28a745",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
})