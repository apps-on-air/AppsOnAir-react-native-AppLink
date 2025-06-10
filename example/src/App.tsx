import { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Button,
} from 'react-native';
import {
  initializeAppLink,
  createAppLink,
  onDeepLinkProcessed,
  getReferralDetails,
  type AppLinkParams,
} from 'appsonair-react-native-applink';

const App = () => {
  const [deepLinkResult, setDeepLinkResult] = useState('');
  const [linkParams, setLinkParams] = useState<AppLinkParams>({
    name: '',
    url: '',
    urlPrefix: '',
    metaTitle: '',
    metaDescription: '',
    metaImageUrl: '',
    iOSFallbackUrl: '',
    androidFallbackUrl: '',
    shortId: '',
    isOpenInAndroidApp: true,
    isOpenInBrowserAndroid: false,
    isOpenInIosApp: true,
    isOpenInBrowserApple: false,
  });

  useEffect(() => {
    initializeAppLink();
    const sub = onDeepLinkProcessed((event) => {
      setDeepLinkResult(`✅ Processed:\n${JSON.stringify(event, null, 2)}`);
    });
    return () => {
      sub?.remove();
    };
  }, []);

  const handleCreateLink = async () => {
    try {
      const result = await createAppLink(linkParams);
      if (result?.status !== 'SUCCESS') {
        throw new Error(result.message.shortUrl || 'Failed to create link');
      }
      Alert.alert(
        'App Link Created',
        result.message?.shortUrl ?? 'No link returned'
      );
    } catch (err: any) {
      Alert.alert('Error Creating Link', err.message || 'Unknown error');
    }
  };

  const handleReferralDetails = () => {
    getReferralDetails()
      .then((info) => {
        Alert.alert('Referral Info', JSON.stringify(info, null, 2));
      })
      .catch((err) => {
        Alert.alert('Error', JSON.stringify(err, null, 2));
      });
  };

  const renderTextInput = (
    label: string,
    value: string,
    key: keyof AppLinkParams
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(text) => setLinkParams({ ...linkParams, [key]: text })}
        placeholder={label}
      />
    </View>
  );

  const renderSwitch = (
    label: string,
    value: boolean,
    key: keyof AppLinkParams
  ) => (
    <View style={styles.switchRow}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={(val) => setLinkParams({ ...linkParams, [key]: val })}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>AppsOnAir AppLink</Text>

        {renderTextInput('Name', linkParams.name, 'name')}
        {renderTextInput('URL', linkParams.url, 'url')}
        {renderTextInput('URL Prefix', linkParams.urlPrefix, 'urlPrefix')}
        {renderTextInput('Meta Title', linkParams.metaTitle || '', 'metaTitle')}
        {renderTextInput(
          'Meta Description',
          linkParams.metaDescription || '',
          'metaDescription'
        )}
        {renderTextInput(
          'Meta Image URL',
          linkParams.metaImageUrl || '',
          'metaImageUrl'
        )}
        {renderTextInput(
          'iOS Fallback URL',
          linkParams.iOSFallbackUrl || '',
          'iOSFallbackUrl'
        )}
        {renderTextInput(
          'Android Fallback URL',
          linkParams.androidFallbackUrl || '',
          'androidFallbackUrl'
        )}
        {renderTextInput('Short ID', linkParams.shortId || '', 'shortId')}

        <View style={styles.switchContainer}>
          {renderSwitch(
            'Open in Android App',
            linkParams.isOpenInAndroidApp!,
            'isOpenInAndroidApp'
          )}
          {renderSwitch(
            'Open in Android Browser',
            linkParams.isOpenInBrowserAndroid!,
            'isOpenInBrowserAndroid'
          )}
          {renderSwitch(
            'Open in iOS App',
            linkParams.isOpenInIosApp!,
            'isOpenInIosApp'
          )}
          {renderSwitch(
            'Open in iOS Browser',
            linkParams.isOpenInBrowserApple!,
            'isOpenInBrowserApple'
          )}
        </View>

        <View style={styles.buttonGroup}>
          <Button title="Create App Link" onPress={handleCreateLink} />
          <Button
            title="Get Referral Details"
            onPress={handleReferralDetails}
          />
        </View>

        <Text style={styles.resultLabel}>Result:</Text>
        <Text style={styles.resultBox}>
          {deepLinkResult || 'Waiting for deep link...'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
  },
  switchContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonGroup: {
    marginTop: 10,
    rowGap: 10,
  },
  resultLabel: {
    fontSize: 18,
    marginTop: 20,
    fontWeight: '600',
  },
  resultBox: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    fontFamily: 'Courier',
  },
});

export default App;
