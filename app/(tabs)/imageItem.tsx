import type React from "react"
import { memo, useState } from "react"
import { StyleSheet, TouchableOpacity, Image, Text, View, ActivityIndicator } from "react-native"

interface ImageItemProps {
  item: {
    uri: string
    id: string
    resolutions?: {
      [key: string]: string
    }
  }
  onPress: () => void
  resolution: string
}

// Usar memo para evitar re-renderizados innecesarios
const ImageItem: React.FC<ImageItemProps> = memo(({ item, onPress, resolution }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Determinar la URL correcta según la resolución
  const imageUrl = item.resolutions && item.resolutions[resolution] ? item.resolutions[resolution] : item.uri

  console.log(`Renderizando imagen ${item.id} con resolución ${resolution}, URL: ${imageUrl}`)

  return (
    <TouchableOpacity style={styles.imageContainer} onPress={onPress}>
      <View style={styles.imageWrapper}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#ffffff" />
          </View>
        )}

        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
          onLoadStart={() => {
            setLoading(true)
            setError(false)
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError(true)
          }}
        />

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error al cargar</Text>
          </View>
        )}

        {/* Indicador de resolución */}
        <View style={styles.resolutionIndicator}>
          <Text style={styles.resolutionText}>{resolution}</Text>
        </View>
      </View>

      <View style={styles.viewButton}>
        <Text style={styles.viewButtonText}>Ver</Text>
      </View>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    aspectRatio: 1,
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 1,
  },
  errorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 1,
  },
  errorText: {
    color: "#fff",
    fontSize: 12,
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
  resolutionIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  resolutionText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
})

export default ImageItem

