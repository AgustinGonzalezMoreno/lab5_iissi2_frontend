import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as yup from 'yup'
import DropDownPicker from 'react-native-dropdown-picker'
import { ErrorMessage, Formik } from 'formik'
import { showMessage } from 'react-native-flash-message'

import {
  getProductCategories,
  getDetail,
  update
} from '../../api/ProductEndpoints'

import InputItem from '../../components/InputItem'
import TextRegular from '../../components/TextRegular'
import TextError from '../../components/TextError'
import ImagePicker from '../../components/ImagePicker'
import * as GlobalStyles from '../../styles/GlobalStyles'
import defaultProductImage from '../../../assets/product.jpeg'
import { prepareEntityImages } from '../../api/helpers/FileUploadHelper'
import { buildInitialValues } from '../Helper'

export default function EditProductScreen ({ navigation, route }) {
  const [open, setOpen] = useState(false)
  const [productCategories, setProductCategories] = useState([])
  const [backendErrors, setBackendErrors] = useState([])
  const [product, setProduct] = useState({})

  const [initialProductValues, setInitialProductValues] = useState({
    name: null,
    description: null,
    price: null,
    order: null,
    availability: true,
    productCategoryId: null,
    image: null
  })

  const validationSchema = yup.object().shape({
    name: yup.string().max(255, 'Name too long').required('Name is required'),
    description: yup.string().nullable(),
    price: yup
      .number()
      .positive('Please provide a valid price')
      .required('Price is required'),
    order: yup
      .number()
      .positive('Please provide a valid order')
      .integer('Order must be an integer')
      .required('Order is required'),
    availability: yup.boolean(),
    productCategoryId: yup
      .number()
      .positive()
      .integer()
      .required('Product category is required')
  })

  useEffect(() => {
    async function fetchProductCategories () {
      try {
        const fetchedProductCategories = await getProductCategories()

        const fetchedProductCategoriesReshaped =
          fetchedProductCategories.map(e => {
            return {
              label: e.name,
              value: e.id
            }
          })

        setProductCategories(fetchedProductCategoriesReshaped)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving product categories. ${error}`,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }

    fetchProductCategories()
  }, [])

  useEffect(() => {
    async function fetchProductDetail () {
      try {
        const fetchedProduct = await getDetail(route.params.id)

        const preparedProduct = prepareEntityImages(fetchedProduct, [
          'image'
        ])

        setProduct(preparedProduct)

        const initialValues = buildInitialValues(
          preparedProduct,
          initialProductValues
        )

        setInitialProductValues(initialValues)
      } catch (error) {
        showMessage({
          message: `There was an error while retrieving product details (id ${route.params.id}). ${error}`,
          type: 'error',
          style: GlobalStyles.flashStyle,
          titleStyle: GlobalStyles.flashTextStyle
        })
      }
    }

    fetchProductDetail()
  }, [route])

  const updateProduct = async values => {
    setBackendErrors([])

    const valuesToSend = { ...values }

    delete valuesToSend.restaurantId

    try {
      const updatedProduct = await update(product.id, valuesToSend)

      showMessage({
        message: `Product ${updatedProduct.name} successfully updated`,
        type: 'success',
        style: GlobalStyles.flashStyle,
        titleStyle: GlobalStyles.flashTextStyle
      })

      navigation.goBack()
    } catch (error) {
      console.log(error)
      setBackendErrors(error.errors)
    }
  }

  return (
    <Formik
      validationSchema={validationSchema}
      initialValues={initialProductValues}
      enableReinitialize
      onSubmit={updateProduct}
    >
      {({ handleSubmit, setFieldValue, values }) => (
        <ScrollView>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: '60%' }}>
              <InputItem name='name' label='Name:' />
              <InputItem name='description' label='Description:' />
              <InputItem name='price' label='Price:' />
              <InputItem name='order' label='Order:' />

              <DropDownPicker
                open={open}
                value={values.productCategoryId}
                items={productCategories}
                setOpen={setOpen}
                onSelectItem={item => {
                  setFieldValue('productCategoryId', item.value)
                }}
                setItems={setProductCategories}
                placeholder='Select the product category'
                containerStyle={{ height: 40, marginTop: 20 }}
                style={{ backgroundColor: GlobalStyles.brandBackground }}
                dropDownStyle={{ backgroundColor: '#fafafa' }}
              />

              <ErrorMessage
                name='productCategoryId'
                render={msg => <TextError>{msg}</TextError>}
              />

              <ImagePicker
                label='Image:'
                image={values.image}
                defaultImage={defaultProductImage}
                onImagePicked={result => setFieldValue('image', result)}
              />

              {backendErrors &&
                backendErrors.map((error, index) => (
                  <TextError key={index}>
                    {error.param}-{error.msg}
                  </TextError>
                ))}

              <Pressable
                onPress={handleSubmit}
                style={({ pressed }) => [
                  {
                    backgroundColor: pressed
                      ? GlobalStyles.brandSuccessTap
                      : GlobalStyles.brandSuccess
                  },
                  styles.button
                ]}
              >
                <View style={styles.buttonContent}>
                  <MaterialCommunityIcons
                    name='content-save'
                    color='white'
                    size={20}
                  />
                  <TextRegular textStyle={styles.text}>Save</TextRegular>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}
    </Formik>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    height: 40,
    padding: 10,
    width: '100%',
    marginTop: 20,
    marginBottom: 20
  },

  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },

  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginLeft: 5
  }
})
