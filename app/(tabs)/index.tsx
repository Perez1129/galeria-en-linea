import { useState, useEffect, useCallback } from "react"
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
import ImageItem from "./imageItem"

export default function GalleryScreen() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [uploadPreviewVisible, setUploadPreviewVisible] = useState(false)
  const [imageToUpload, setImageToUpload] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [currentResolution, setCurrentResolution] = useState("500px")
  const [imageLoading, setImageLoading] = useState(false)

  const windowWidth = Dimensions.get("window").width
  const numColumns = windowWidth > 600 ? 3 : 2

  useEffect(() => {
    loadImages()
  }, [])

  // Función para cambiar la resolución
  interface Image {
    id: string
    uri: string
    resolutions?: { [key: string]: string }
  }

  type Resolution = "250px" | "500px" | "750px"

  const changeResolution = useCallback(
    (newResolution: Resolution) => {
      console.log("Cambiando resolución a:", newResolution)
      setCurrentResolution(newResolution)
      // Forzar una recarga de la imagen en el modal si está visible
      if (previewVisible && selectedImage) {
        setImageLoading(true)
        setTimeout(() => setImageLoading(false), 500) // Simular carga
      }
    },
    [previewVisible, selectedImage],
  )

  const loadImages = async () => {
    try {
      setLoading(true)
      const data = await fetchImages()
      console.log("Imágenes cargadas:", data.length)
      setImages(data || [])
    } catch (error) {
      console.error("Error al cargar imágenes:", error)
      Alert.alert("Error", "No se pudieron cargar las imágenes")
    } finally {
      setLoading(false)
    }
  }

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos permisos para acceder a la galería")
        return
      }

      // Usar MediaType en lugar de MediaTypeOptions (que está obsoleto)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images", // Usar string en lugar de enum
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      })

      console.log("Resultado de ImagePicker:", result)

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageToUpload(result.assets[0])
        setUploadPreviewVisible(true)
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error)
      Alert.alert("Error", "No se pudo seleccionar la imagen")
    }
  }

  const handleUploadImage = async () => {
    if (!imageToUpload) return

    setLoading(true)

    try {
      console.log("Iniciando carga de imagen:", imageToUpload.uri)
      const result = await uploadImage(imageToUpload.uri)

      if (result) {
        console.log("Imagen subida correctamente, recargando imágenes")
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

  interface Image {
    id: string
    uri: string
    resolutions?: { [key: string]: string }
  }

  const handleDeleteImage = async (id: string): Promise<void> => {
    setLoading(true)

    try {
      await deleteImage(id)

      // Recargar las imágenes después de eliminar
      await loadImages()
      setPreviewVisible(false)
    } catch (error) {
      console.error("Error al eliminar imagen:", error)
      Alert.alert("Error", "No se pudo eliminar la imagen")
    } finally {
      setLoading(false)
    }
  }

  const renderItem = ({ item }: { item: Image }) => {
    console.log("Renderizando item con resolución:", currentResolution)
    return (
      <ImageItem
        item={item}
        resolution={currentResolution}
        onPress={() => {
          setSelectedImage(item)
          setPreviewVisible(true)
        }}
      />
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Galería de Imágenes</Text>
        <View style={styles.resolutionSelector}>
          <Text style={styles.resolutionText}>Resolución: </Text>
          <TouchableOpacity
            style={[styles.resolutionButton, currentResolution === "250px" && styles.activeResolution]}
            onPress={() => changeResolution("250px")}
          >
            <Text style={styles.resolutionButtonText}>250px</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resolutionButton, currentResolution === "500px" && styles.activeResolution]}
            onPress={() => changeResolution("500px")}
          >
            <Text style={styles.resolutionButtonText}>500px</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resolutionButton, currentResolution === "750px" && styles.activeResolution]}
            onPress={() => changeResolution("750px")}
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
          keyExtractor={(item) => item.id || String(Math.random())}
          numColumns={numColumns}
          contentContainerStyle={styles.imageGrid}
          refreshing={loading}
          onRefresh={loadImages}
          extraData={currentResolution} // Importante: esto hace que la lista se actualice cuando cambia la resolución
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
            <View style={styles.resolutionInfo}>
              <Text style={styles.resolutionInfoText}>Resolución: {currentResolution}</Text>
            </View>
            {selectedImage && (
              <View style={styles.previewImageContainer}>
                {imageLoading && (
                  <View style={styles.previewLoadingContainer}>
                    <ActivityIndicator size="large" color="#ffffff" />
                  </View>
                )}
                <Image
                  key={`${selectedImage.id}-${currentResolution}`} // Forzar recreación de la imagen al cambiar resolución
                  source={{
                    uri: selectedImage.resolutions
                      ? selectedImage.resolutions[currentResolution] || selectedImage.uri
                      : selectedImage.uri,
                  }}
                  style={styles.previewImage}
                  resizeMode="contain"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                />
              </View>
            )}
            <View style={styles.modalResolutionSelector}>
              <TouchableOpacity
                style={[styles.modalResolutionButton, currentResolution === "250px" && styles.activeResolution]}
                onPress={() => changeResolution("250px")}
              >
                <Text style={styles.modalResolutionButtonText}>250px</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalResolutionButton, currentResolution === "500px" && styles.activeResolution]}
                onPress={() => changeResolution("500px")}
              >
                <Text style={styles.modalResolutionButtonText}>500px</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalResolutionButton, currentResolution === "750px" && styles.activeResolution]}
                onPress={() => changeResolution("750px")}
              >
                <Text style={styles.modalResolutionButtonText}>750px</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setPreviewVisible(false)}>
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={() => selectedImage && handleDeleteImage(selectedImage.id)}
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
    backgroundColor: "#28a745", // Verde
  },
  resolutionButtonText: {
    color: "#fff",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745", // Verde
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
  previewImageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#000",
    position: "relative",
  },
  previewLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
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
    backgroundColor: "#28a745", // Verde
    minWidth: 100,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#dc3545", // Rojo
  },
  uploadModalButton: {
    backgroundColor: "#28a745", // Verde
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
  resolutionInfo: {
    backgroundColor: "#333",
    padding: 8,
    alignItems: "center",
  },
  resolutionInfoText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalResolutionSelector: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 8,
    backgroundColor: "#222",
  },
  modalResolutionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#333",
    borderRadius: 4,
    marginHorizontal: 4,
  },
  modalResolutionButtonText: {
    color: "#fff",
  },
})

