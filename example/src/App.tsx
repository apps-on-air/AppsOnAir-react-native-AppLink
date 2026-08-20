import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {
  createAppLink,
  getAttributionInfo,
  getReferralDetails,
  getReferralInfo,
  initializeAppLink,
  onAttributionListener,
  onDeepLinkProcessed,
  onReferralLinkDetected,
  type AppLinkParams,
  type AppsFlyerParams,
  type CreateAppLinkResponse,
} from 'appsonair-react-native-applink';

const App = () => {
  const [deepLinkResult, setDeepLinkResult] = useState('');
  const [attributionResult, setAttributionResult] = useState('');
  const [referralResult, setReferralResult] = useState('');
  const [installReferrer, setInstallReferrer] = useState('');
  // Nested params are kept outside linkParams so the flat input helper stays simple.
  const [attributionTtl, setAttributionTtl] = useState('');
  // No UI for these at the moment, so they stay empty; index.tsx maps empty strings to null.
  const [socialMeta] = useState({
    title: '',
    description: '',
    imageUrl: '',
  });
  // The native layers forward this dictionary to the API untouched, so it is edited as raw JSON
  // rather than fixed fields — any keys beyond the documented ones are passed through as-is.
  const [appsFlyerJson, setAppsFlyerJson] = useState(
    JSON.stringify(
      {
        channel: 'email',
        campaignId: '01',
        campaign: 'test',
        subs: ['sub1', 'sub2', 'sub3', 'sub4', 'sub5'],
        metaTitle: 'metaTitle',
        metaDescription: 'metaDescription',
      },
      null,
      2
    )
  );
  const [linkParams, setLinkParams] = useState<AppLinkParams>({
    name: '',
    url: '',
    urlPrefix: '',
    iosFallbackUrl: '',
    androidFallbackUrl: '',
    shortId: '',
    isOpenInAndroidApp: true,
    isOpenInBrowserAndroid: false,
    isOpenInIosApp: true,
    isOpenInBrowserApple: false,
  });

  useEffect(() => {
    initializeAppLink();
    const deepLink = onDeepLinkProcessed((event) => {
      console.log(`✅ Processed:\n${JSON.stringify(event, null, 2)}`);
      setDeepLinkResult(`✅ Processed:\n${JSON.stringify(event, null, 2)}`);
    });

    const attribution = onAttributionListener((event) => {
      console.log(`✅ Attribution:\n${JSON.stringify(event, null, 2)}`);
      setAttributionResult(
        `✅ Attributions:\n${JSON.stringify(event, null, 2)}`
      );
    });


    const referral = onReferralLinkDetected((event) => {
      console.log(`✅ Referral:\n${JSON.stringify(event, null, 2)}`);
      setReferralResult(`✅ Referral:\n${JSON.stringify(event, null, 2)}`);
    });

    return () => {
      deepLink?.remove();
      attribution?.remove();
      referral?.remove();
    };
  }, []);

  const handleCreateLink = async () => {
    try {
      const ttl = Number(attributionTtl);

      // Parsed here so malformed JSON is reported on its own rather than as an API failure.
      let appsFlyer: AppsFlyerParams | undefined;
      const trimmedAppsFlyer = appsFlyerJson.trim();
      if (trimmedAppsFlyer) {
        try {
          appsFlyer = JSON.parse(trimmedAppsFlyer);
        } catch {
          Alert.alert('Invalid AppsFlyer JSON', 'Fix the JSON and try again.');
          return;
        }
      }

      const result: CreateAppLinkResponse = await createAppLink({
        ...linkParams,
        socialMeta,
        attributionTtl: attributionTtl && !isNaN(ttl) ? ttl : undefined,
        appsFlyer,
      });

      if ('error' in result) {
        throw new Error(result.error);
      }

      if ('status' in result && result.status !== 'SUCCESS') {
        throw new Error(result.message);
      }

      if ('data' in result) {
        const shortUrl = result.data.shortUrl;

        Alert.alert('AppLink Created', shortUrl);
      } else {
        throw new Error(
          result.message ?? 'No data returned from createAppLink'
        );
      }
    } catch (err: any) {
      console.log(err);
      Alert.alert('Error Creating Link', err.message || 'Unknown error');
    }
  };

  const handleInstallReferrer = async () => {
    if (Platform.OS !== 'android') {
      setInstallReferrer(
        'Android only — the Play install referrer has no iOS equivalent.'
      );
      return;
    }
    try {
      const referrer = await DeviceInfo.getInstallReferrer();
      console.log(`ℹ️ Install referrer: ${referrer}`);
      setInstallReferrer(
        referrer || 'Empty — no referrer recorded for this install.'
      );
    } catch (error) {
      setInstallReferrer(`Error: ${JSON.stringify(error)}`);
    }
  };

  const handleAttributionInfo = async () => {
    try {
      const info = await getAttributionInfo();
      console.log(`ℹ️ Attribution info:\n${JSON.stringify(info, null, 2)}`);
      Alert.alert('Attribution Info', JSON.stringify(info, null, 2));
    } catch (error) {
      Alert.alert('Error', JSON.stringify(error, null, 2));
    }
  };

  // Deprecated. Calls the native getReferralInfo, which returns the referral payload only:
  const handleReferralInfo = async () => {
    try {
      const info = await getReferralInfo();
      console.log(`ℹ️ Referral info:\n${JSON.stringify(info, null, 2)}`);
      Alert.alert('Referral Info', JSON.stringify(info, null, 2));
    } catch (error) {
      Alert.alert('Error', JSON.stringify(error, null, 2));
    }
  };

  // Deprecated. Calls the native getReferralDetails: the referral payload only, no isFirstLaunch
  const handleReferralDetails = async () => {
    try {
      const details = await getReferralDetails();
      console.log(`ℹ️ Referral details:\n${JSON.stringify(details, null, 2)}`);
      Alert.alert('Referral Details', JSON.stringify(details, null, 2));
    } catch (error: any) {
      Alert.alert('Error', error?.message || JSON.stringify(error, null, 2));
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    keyboardType: 'default' | 'number-pad' = 'default'
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={label}
      />
    </View>
  );

  const renderTextInput = (
    label: string,
    value: string,
    key: keyof AppLinkParams
  ) =>
    renderInput(label, value, (text) =>
      setLinkParams({ ...linkParams, [key]: text })
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
        {renderTextInput(
          'iOS Fallback URL',
          linkParams.iosFallbackUrl || '',
          'iosFallbackUrl'
        )}
        {renderTextInput(
          'Android Fallback URL',
          linkParams.androidFallbackUrl || '',
          'androidFallbackUrl'
        )}
        {renderTextInput('Short ID', linkParams.shortId || '', 'shortId')}

        {renderInput(
          'Attribution TTL (seconds)',
          attributionTtl,
          setAttributionTtl,
          'number-pad'
        )}

        <Text style={styles.sectionTitle}>AppsFlyer</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            AppsFlyer params (JSON, any keys allowed)
          </Text>
          <TextInput
            style={[styles.input, styles.jsonInput]}
            value={appsFlyerJson}
            onChangeText={setAppsFlyerJson}
            multiline={true}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="{}"
          />
        </View>

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
          <Button title="Create AppLink" onPress={handleCreateLink} />
          <Button
            title="Get Attribution Info"
            onPress={handleAttributionInfo}
          />
        </View>

        <Text style={styles.resultLabel}>Result:</Text>
        <Text style={styles.resultBox} selectable={true}>
          {deepLinkResult || 'Waiting for deep link...'}
        </Text>
        <Text style={styles.resultBox} selectable={true}>
          {attributionResult || 'Waiting for attribution...'}
        </Text>

        <Text style={styles.sectionTitle}>Deprecated APIs</Text>
        <View style={styles.buttonGroup}>
          <Button title="Get Referral Info" onPress={handleReferralInfo} />
          <Button
            title="Get Referral Details"
            onPress={handleReferralDetails}
          />
        </View>

        <Text style={styles.resultLabel}>onReferralLinkDetected:</Text>
        <Text style={styles.resultBox} selectable={true}>
          {referralResult || 'Waiting for referral link...'}
        </Text>

        <Text style={styles.sectionTitle}>Play Install Referrer</Text>
        <View style={styles.buttonGroup}>
          <Button
            title="Get Install Referrer"
            onPress={handleInstallReferrer}
          />
        </View>

        <Text style={styles.resultLabel}>DeviceInfo.getInstallReferrer():</Text>
        <Text style={styles.resultBox} selectable={true}>
          {installReferrer || 'Not fetched yet.'}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
  jsonInput: {
    minHeight: 140,
    textAlignVertical: 'top',
    fontFamily: 'Courier',
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
