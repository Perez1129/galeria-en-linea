import * as FileSystem from "expo-file-system"

// URL del backend

const API_URL = "3523110939_backend.mobilelap.space"

// Función para obtener todas las imágenes
export const fetchImages = async () => {
  try {
    console.log("Obteniendo imágenes desde:", `${API_URL}/images`)
    const response = await fetch(`${API_URL}/images`)

    if (!response.ok) {
      console.error("Error de respuesta:", response.status, response.statusText)
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const data = await response.json()
    console.log("Imágenes obtenidas:", data)

    // Transformar la respuesta de Cloudflare al formato que espera nuestra app
    if (data && data.result && Array.isArray(data.result.images)) {
      return data.result.images.map((image) => {
        console.log("Procesando imagen:", image.id, "con variantes:", image.variants)

        // Crear URLs específicas para cada resolución usando parámetros de consulta
        // Esto asegura que tengamos diferentes URLs para cada resolución
        const baseUrl = image.variants[0]

        // Crear URLs con parámetros de ancho y altura para forzar diferentes resoluciones
        const resolutions = {
          "250px": createResizedImageUrl(baseUrl, 250),
          "500px": createResizedImageUrl(baseUrl, 500),
          "750px": createResizedImageUrl(baseUrl, 750),
        }

        console.log("URLs de resolución creadas:", resolutions)

        return {
          id: image.id,
          uri: baseUrl,
          resolutions: resolutions,
        }
      })
    }

    return []
  } catch (error) {
    console.error("Error al obtener imágenes:", error)
    throw error
  }
}

// Función para crear una URL con parámetros de tamaño
const createResizedImageUrl = (baseUrl, size) => {
  // Si la URL ya tiene parámetros de consulta, añadir los nuevos parámetros
  if (baseUrl.includes("?")) {
    return `${baseUrl}&width=${size}&height=${size}`
  }
  // Si no tiene parámetros, añadir los nuevos parámetros
  return `${baseUrl}?width=${size}&height=${size}`
}

// Función para obtener la variante de imagen más cercana al tamaño deseado
// Esta función ya no se usa, pero la mantenemos por si acaso
const getVariantBySize = (variants, size) => {
  if (!variants || variants.length === 0) return null

  // Si solo hay una variante, usarla para todos los tamaños
  if (variants.length === 1) return variants[0]

  // Intentar encontrar una variante que contenga el tamaño en su URL
  const sizeVariant = variants.find((url) => url.includes(`/${size}/`))
  if (sizeVariant) {
    console.log(`Encontrada variante para tamaño ${size}:`, sizeVariant)
    return sizeVariant
  }

  // Si no se encuentra, usar la primera variante
  console.log(`No se encontró variante para tamaño ${size}, usando default:`, variants[0])
  return variants[0]
}

// Función para subir una imagen
export const uploadImage = async (imageUri) => {
  try {
    // Obtener información del archivo
    const fileInfo = await FileSystem.getInfoAsync(imageUri)
    if (!fileInfo.exists) {
      throw new Error("El archivo de imagen no existe")
    }

    console.log("Subiendo imagen:", imageUri)

    // Crear un FormData para enviar la imagen
    const formData = new FormData()

    // Obtener el nombre del archivo y su extensión
    const uriParts = imageUri.split(".")
    const fileExtension = uriParts[uriParts.length - 1]

    // Determinar el tipo MIME basado en la extensión
    let fileType = "image/jpeg"
    if (fileExtension.toLowerCase() === "png") {
      fileType = "image/png"
    } else if (fileExtension.toLowerCase() === "gif") {
      fileType = "image/gif"
    }

    // Agregar la imagen al FormData con el nombre 'file' como espera el backend
    formData.append("file", {
      uri: imageUri,
      name: `photo.${fileExtension}`,
      type: fileType,
    })

    console.log("Enviando solicitud a:", `${API_URL}/images/upload`)

    // Enviar la solicitud al backend
    const response = await fetch(`${API_URL}/images/upload`, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error de respuesta:", response.status, errorText)
      throw new Error(`Error HTTP: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("Imagen subida con éxito:", result)
    return result
  } catch (error) {
    console.error("Error al subir imagen:", error)
    throw error
  }
}

// Función para eliminar una imagen
export const deleteImage = async (imageId) => {
  try {
    console.log("Eliminando imagen:", imageId)
    const response = await fetch(`${API_URL}/images/${imageId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      console.error("Error de respuesta:", response.status, response.statusText)
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const result = await response.json()
    console.log("Imagen eliminada con éxito:", result)
    return result
  } catch (error) {
    console.error("Error al eliminar imagen:", error)
    throw error
  }
}

