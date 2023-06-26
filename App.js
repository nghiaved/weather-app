import { StatusBar } from 'expo-status-bar';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from './theme'
import { MagnifyingGlassIcon } from 'react-native-heroicons/outline'
import { CalendarDaysIcon, MapPinIcon } from 'react-native-heroicons/solid'
import React, { useCallback, useEffect, useState } from 'react';
import { debounce } from 'lodash'
import { fetchLocations, fetchWeatherForecast } from './api/weather'
import { weatherImages } from './constants'
import * as Progress from 'react-native-progress'
import { storeData, getData } from './utils/asyncStorage';

export default function App() {
  const [showSearch, setShowSearch] = useState(false)
  const [locations, setLocations] = useState([])
  const [weather, setWeather] = useState({})
  const [loading, setLoading] = useState(true)

  const handleSearch = value => {
    if (value && value.length > 2)
      fetchLocations({ cityName: value }).then(data => {
        setLocations(data);
      })
  }

  const handleLocation = loc => {
    setLocations([])
    setShowSearch(false)
    setLoading(true)
    fetchWeatherForecast({
      cityName: loc.name,
      days: '7'
    }).then(data => {
      setWeather(data)
      setLoading(false)
      storeData('city', loc.name)
    })
  }

  useEffect(() => {
    fetchMyWeatherData()
  }, [])

  const fetchMyWeatherData = async () => {
    let myCity = await getData('city')
    let cityName = 'Can Tho'
    if (myCity) cityName = myCity
    fetchWeatherForecast({
      cityName,
      days: '7'
    }).then(data => {
      setWeather(data)
      setLoading(false)
    })
  }

  const handleTextDebounce = useCallback(debounce(handleSearch, 1200), [])

  const { current, location } = weather

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image blurRadius={70} style={styles.bgImg} source={require('./assets/images/bg.png')} />
      {loading ?
        <View style={styles.loading}>
          <Progress.CircleSnail thickness={10} size={140} color='#0bb3b2' />
        </View> :
        <SafeAreaView style={styles.content}>
          <View style={[
            styles.header, ,
            showSearch && { backgroundColor: theme.bgWhite(0.2) }
          ]}>
            {showSearch &&
              <TextInput onChangeText={handleTextDebounce}
                style={styles.input}
                placeholder='Search city'
                placeholderTextColor={'lightgray'} />
            }
            <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.wrapperIcon}>
              <MagnifyingGlassIcon size='25' color='white' />
            </TouchableOpacity>
            {locations.length > 0 && showSearch && (
              <View style={styles.locations}>
                {
                  locations.map((loc, index) => {
                    let showBorder = index + 1 != locations.length
                    let borderStyle = showBorder ? {
                      borderBottomColor: 'gray',
                      borderBottomWidth: 2,
                    } : {}
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.location, borderStyle]}
                        onPress={() => handleLocation(loc)}
                      >
                        <MapPinIcon size='20' color='gray' />
                        <Text style={styles.locationText}>{loc?.name}, {loc?.country}</Text>
                      </TouchableOpacity>
                    )
                  })
                }
              </View>
            )}
          </View>
          <View style={styles.main}>
            <Text style={styles.title}>
              {location?.name},
              <Text style={styles.subTitle}> {location?.country}</Text>
            </Text>
            <View>
              <Image style={styles.mainImg}
                // source={{ uri: 'https:' + current?.condition?.icon }}
                source={weatherImages[current?.condition?.text || 'other']}
              />
            </View>
            <View>
              <Text style={styles.temperature}>
                {current?.temp_c}&#176;
              </Text>
              <Text style={styles.tempText}>
                {current?.condition?.text}
              </Text>
            </View>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Image style={styles.statImg} source={require('./assets/icons/wind.png')} />
                <Text style={styles.statText}>{current?.wind_kph}km</Text>
              </View>
              <View style={styles.statItem}>
                <Image style={styles.statImg} source={require('./assets/icons/drop.png')} />
                <Text style={styles.statText}>{current?.humidity}%</Text>
              </View>
              <View style={styles.statItem}>
                <Image style={styles.statImg} source={require('./assets/icons/sun.png')} />
                <Text style={styles.statText}>{weather?.forecast?.forecastday[0]?.astro?.sunrise}</Text>
              </View>
            </View>
          </View>
          <View style={styles.forecastWrapper}>
            <View style={styles.forecastTitle}>
              <CalendarDaysIcon size='22' color='white' />
              <Text style={styles.forecastSubTitle}> Daily forcast</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ columnGap: 15 }}
            >
              {
                weather?.forecast?.forecastday?.map((item, index) => {
                  const date = new Date(item.date);
                  const options = { weekday: 'long' };
                  let dayName = date.toLocaleDateString('en-US', options);
                  dayName = dayName.split(',')[0];

                  return (
                    <View key={index} style={styles.forecast}>
                      <Image style={styles.forecastImg} source={weatherImages[item?.day?.condition?.text || 'other']} />
                      <Text style={styles.forecastText}>{dayName}</Text>
                      <Text style={styles.forecastTemp}>{item?.day?.avgtemp_c}&#176;</Text>
                    </View>
                  )
                })
              }
            </ScrollView>
          </View>
        </SafeAreaView>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
  bgImg: {
    position: 'absolute',
    width: '100vw',
    height: '100vh'
  },
  content: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRadius: 50,
    margin: 20,
    backgroundColor: 'transparent',
    zIndex: 1
  },
  input: {
    flex: 1,
    paddingLeft: 20,
    outlineStyle: 'none'
  },
  wrapperIcon: {
    backgroundColor: theme.bgWhite(0.3),
    borderRadius: 50,
    padding: 15,
    margin: 5,
  },
  locations: {
    position: 'absolute',
    borderRadius: 20,
    top: 80,
    width: '100%',
    backgroundColor: 'white',
  },
  location: {
    flexDirection: 'row',
    padding: 20,
  },
  locationText: {
    marginLeft: 10
  },
  main: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  title: {
    color: 'white',
    fontWeight: 700,
    fontSize: 24
  },
  subTitle: {
    color: 'gray',
    fontSize: 20
  },
  mainImg: {
    width: 200,
    height: 200,
  },
  temperature: {
    fontWeight: 700,
    fontSize: 50,
    color: 'white',
    textAlign: 'center'
  },
  tempText: {
    fontSize: 20,
    color: 'white'
  },
  stats: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statImg: {
    width: 40,
    height: 40
  },
  statText: {
    marginLeft: 10,
    color: 'white',
    fontWeight: 600
  },
  forecastWrapper: {
    padding: 20,
  },
  forecastTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  forecastSubTitle: {
    color: 'white'
  },
  forecast: {
    backgroundColor: theme.bgWhite(0.2),
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  forecastImg: {
    width: 40,
    height: 40,
  },
  forecastText: {
    color: 'white',
    marginVertical: 5
  },
  forecastTemp: {
    color: 'white',
    fontSize: 20,
    fontWeight: 600
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
