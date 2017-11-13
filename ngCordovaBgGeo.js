(function(){

// install   :     cordova plugin add https://github.com/christocracy/cordova-plugin-background-geolocation.git
// link      :     https://github.com/christocracy/cordova-plugin-background-geolocation

angular.module('ngCordovaBgGeo', [])

  .factory('$ngCordovaBgGeo', ['$q', '$window', function ($q, $window) {

    var BackgroundGeolocation =
      (
        ($window.plugins && $window.plugins.backgroundGeolocation) ?
        $window.plugins.backgroundGeoLocation :
        undefined
      ) ||
      (
        ($window.BackgroundGeolocation) ?
        $window.BackgroundGeolocation :
        undefined
      ) || {};

    var
      DESIRED_ACCURACY_HIGH = 0, // GPS + Wifi + Cellular   Highest power; highest accuracy
      DESIRED_ACCURACY_MEDIUM = 10, // Wifi + Cellular   Medium power; Medium accuracy;
      DESIRED_ACCURACY_LOW = 100, // Wifi (low power) + Cellular   Lower power; No GPS
      DESIRED_ACCURACY_VERY_LOW = 1000, // Cellular only  Lowest power; lowest accuracy

      LOG_LEVEL_OFF = 0,
      LOG_LEVEL_ERROR = 1,
      LOG_LEVEL_WARNING = 2,
      LOG_LEVEL_INFO = 3,
      LOG_LEVEL_DEBUG = 4,
      LOG_LEVEL_VERBOSE = 5;

    return {

      EVENTS: [
        'location', //  Fired whenever a new location is recorded.
        'motionchange', //  Fired when the device changes state between stationary and moving
        'activitychange', //  Fired when the activity-recognition system detects a change in detected-activity (still, on_foot, in_vehicle, on_bicycle, running)
        'providerchange', //  Fired when a change in the state of the device's Location Services has been detected. eg: "GPS ON", "Wifi only".
        'geofence', //  Fired when a geofence crossing event occurs.
        'geofenceschange', //   Fired when the list of monitored geofences within #geofenceProximityRadius changed
        'http', //  Fired after a successful HTTP response. response object is provided with status and responseText.
        'heartbeat', //   Fired each #heartbeatInterval while the plugin is in the stationary state with. Your callback will be provided with a params {} containing the last known location {Object}
        'schedule', //  Fired when a schedule event occurs. Your callbackFn will be provided with the current state Object.
        'powersavechange' //   Fired when the state of the operating-system's "Power Saving" system changes. Your callbackFn will be provided with a Boolean showing whether "Power Saving" is enabled or disabled
      ],

      DESIRED_ACCURACY_HIGH: DESIRED_ACCURACY_HIGH
      DESIRED_ACCURACY_MEDIUM: DESIRED_ACCURACY_MEDIUM,
      DESIRED_ACCURACY_LOW: DESIRED_ACCURACY_LOW,
      DESIRED_ACCURACY_VERY_LOW: DESIRED_ACCURACY_VERY_LOW,

      LOG_LEVEL_OFF: LOG_LEVEL_OFF,
      LOG_LEVEL_ERROR: LOG_LEVEL_ERROR,
      LOG_LEVEL_WARNING: LOG_LEVEL_WARNING,
      LOG_LEVEL_INFO: LOG_LEVEL_INFO,
      LOG_LEVEL_DEBUG: LOG_LEVEL_DEBUG,
      LOG_LEVEL_VERBOSE: LOG_LEVEL_VERBOSE,

      defaultConfig: function() {
        return {
          // Geolocation Common Options
          desiredAccuracy: 0,
          distanceFilter: 10,
          disableElasticity: false,
          elasticityMultiplier: 1,
          stopAfterElapsedMinutes: 0,
          stopOnStationary: false,
          desiredOdometerAccuracy: 100,

          // Geolocation iOS Options
          stationaryRadius: 25,
          useSignificantChangesOnly: false,
          locationAuthorizationRequest: 'Always',
          locationAuthorizationAlert: {},
          
          // Geolocation Android Options
          locationUpdateInterval: 1000,
          fastestLocationUpdateInterval: 10000,
          deferTime: 0,
          
          // Activity Recognition Common Options
          activityRecognitionInterval: 10000,
          stopTimeout: 5,
          minimumActivityRecognitionConfidence: 75,
          stopDetectionDelay: 0,
          disableStopDetection: false,
          
          // Activity Recognition iOS Options
          activityType: 'Other',
          disableMotionActivityUpdates: false,

          // HTTP & Persistence Options
          url: null, // Your server url where you wish to HTTP POST locations to
          httpTimeout: 60000, // HTTP request timeout in milliseconds.
          params: null,  // Optional HTTP params sent along in HTTP request to above #url
          extras: null, // Optional meta-data to attach to each recorded location
          headers: null, // Optional HTTP headers sent along in HTTP request to above #url
          method: 'POST',  // The HTTP method. Defaults to POST. Some servers require PUT.
          httpRootProperty: 'location', // The root property of the JSON data where location-data will be appended.
          locationTemplate: undefined,  // Optional custom location data schema (eg: { "lat:<%= latitude %>, "lng":<%= longitude %> }
          geofenceTemplate:  undefined, // Optional custom geofence data schema (eg: { "lat:<%= latitude %>, "lng":<%= longitude %>, "geofence":"<%= geofence.identifier %>:<%= geofence.action %>" }
          autoSync: true, // If you've enabeld HTTP feature by configuring an #url, the plugin will attempt to upload each location to your server as it is recorded.
          autoSyncThreshold: 0, // The minimum number of persisted records to trigger an #autoSync action.
          batchSync: false,  // If you've enabled HTTP feature by configuring an #url, batchSync: true will POST all the locations currently stored in native SQLite datbase to your server in a single HTTP POST request.
          maxBatchSize: -1,  // If you've enabled HTTP feature by configuring an #url and batchSync: true, this parameter will limit the number of records attached to each batch.
          maxDaysToPersist: 1,   // Maximum number of days to store a geolocation in plugin's SQLite database.
          maxRecordsToPersist: -1,  // Maximum number of records to persist in plugin's SQLite database. Defaults to -1 (no limit). To disable persisting locations, set this to 0
          locationsOrderDirection: 'ASC',

          // Application Common Options
          debug: true,  // <-- Debug sounds & notifications.
          stopOnTerminate: false,
          startOnBoot: true,
          heartbeatInterval: 60,
          schedule: undefined,

          // Application iOS Options
          preventSuspend: false,

          // Application Android Options
          foregroundService:  false,  // Set true to make the plugin mostly immune to OS termination due to memory pressure from other apps.
          notificationPriority:  undefined, // defaults to NOTIFICATION_PRIORITY_DEFAULT // Controls the priority of the foregroundService notification and notification-bar icon.
          notificationTitle:  "Your App Name", // When running the service with foregroundService: true, Android requires a persistent notification in the Notification Bar. Defaults to the application name
          notificationText: "Location service activated", // When running the service with foregroundService: true, Android requires a persistent notification in the Notification Bar.
          notificationColor:  null, // When running the service with foregroundService: true, controls the color of the persistent notification in the Notification Bar.
          notificationSmallIcon:  'Your App Icon',  // When running the service with foregroundService: true, controls your customize notification small icon. Defaults to your application icon.
          notificationLargeIcon: undefined,  // When running the service with foregroundService: true, controls your customize notification large icon. Defaults to undefined.
          forceReloadOnMotionChange: false,  // Launch your app whenever the #motionchange event fires.
          forceReloadOnLocationChange: false, // Launch your app whenever the #location event fires.
          forceReloadOnGeofence: false,  // Launch your app whenever the #geofence event fires.
          forceReloadOnHeartbeat: false,  // Launch your app whenever the #heartbeat event fires.
          forceReloadOnSchedule: false,  // Launch your app whenever a schedule event fires.
          forceReloadOnBoot: false,  // If the user reboots the device with the plugin configured for startOnBoot: true, your will app will launch when the device is rebooted.

          // Geofencing Options
          geofenceProximityRadius: 1000,  // Radius in meters to query for geofences within proximity.
          geofenceInitialTriggerEntry: true, // Set false to disable triggering a geofence immediately if device is already inside it.

          // Logging & Debug Options
          debug:   false,  // When enabled, the plugin will emit sounds & notifications for life-cycle events of background-geolocation
          logLevel: LOG_LEVEL_VERBOSE,  // Defaults to LOG_LEVEL_VERBOSE   Sets the verbosity of the plugin's logs from LOG_LEVEL_OFF to LOG_LEVEL_VERBOSE
          logMaxDays: 3  // Maximum days to persist a log-entry in database.
        };
      },

      // CORE API
      
      //configure  {config}, successFn, failureFn Initializes the plugin and configures its config options.  The success callback will be executed after the plugin has successfully configured and provided with the current state Object.
      configure: function (options) {
        var q = $q.defer();

        BackgroundGeolocation.configure(
          options,
          function successCb(result) {
            q.resolve(result);
          },
          function failureCb(err) {
            q.reject(err);
          }
        );

        return q.promise;
      },

      // setConfig {config}, successFn, failureFn  Re-configure the plugin with new config options.
      setConfig: function (options) {
        var q = $q.defer();

        BackgroundGeolocation.setConfig(
          options,
          function successCb(result) {
            q.resolve(result);
          },
          function failureCb(err) {
            q.reject(err);
          }
        );

        return q.promise;
      },

      // on  event,successFn,failureFn   Adds an event-listener
      on: function (event) {
        var q = $q.defer();

        BackgroundGeolocation.on(
          event,
          function successCb(result) {
            q.notify(null, result);
          },
          function failureCb(err) {
            q.notify(err, null);
          }
        );

        return q.promise;
      },

      // un  event,callbackFn,   Removes an event-listener
      un: function (event) {
        var q = $q.defer();

        BackgroundGeolocation.un(
          event,
          function (result) {
            q.resolve(result);
          });

        return q.promise;
      },

      // start   callbackFn  Enable location tracking. Supplied callbackFn will be executed when tracking is successfully engaged. This is the plugin's power ON button.
      start: function () {
        var q = $q.defer();

        BackgroundGeolocation.start(
          function (state) {
            q.resolve(state);
          },
          function (err) {
            q.reject(err);
          });

        return q.promise;
      },

      // stop    callbackFn  Disable location tracking. Supplied callbackFn will be executed when tracking is successfully halted. This is the plugin's power OFF button.
      stop: function () {
        var q = $q.defer();

        BackgroundGeolocation.stop(
          function (result) {
            q.resolve(result);
          },
          function (err) {
            q.reject(err);
          });

        return q.promise;
      },

      // getState  callbackFn  Fetch the current-state of the plugin, including enabled, isMoving, as well as all other config params
      getState: function () {
        var q = $q.defer();

        BackgroundGeolocation.getState(
          function (result) {
            q.resolve(result);
          }
        );

        return q.promise;
      },

      // getCurrentPosition  successFn, failureFn, {options}   Retrieves the current position using maximum power & accuracy by fetching a number of samples and returning the most accurate to your callbackFn.
      //
      // @options {Integer} timeout [30] An optional location-timeout. If the timeout expires before a location is retrieved, the failureFn will be executed.
      // @options {Integer millis} maximumAge [0] Accept the last-recorded-location if no older than supplied value in milliseconds.
      // @options {Boolean} persist [true] Defaults to true. Set false to disable persisting the retrieved location in the plugin's SQLite database.
      // @options {Integer} samples [3] Sets the maximum number of location-samples to fetch. The plugin will return the location having the best accuracy to your successFn. Defaults to 3. Only the final location will be persisted.
      // @options {Integer} desiredAccuracy [stationaryRadius] Sets the desired accuracy of location you're attempting to fetch. When a location having accuracy <= desiredAccuracy is retrieved, the plugin will stop sampling and immediately return that location. Defaults to your configured stationaryRadius.
      // @options {Object} extras Optional extra-data to attach to the location. These extras {Object} will be merged to the recorded location and persisted / POSTed to your server (if you've configured the HTTP Layer).
      //
      // successFn Parameters
      // @param {Object} location The Location data
      //
      //
      // failureFn Parameters
      // @param {Integer} errorCode If a location failed to be retrieved, one of the following error-codes will be returned
      //    Code  Error
      //    0     Location unknown
      //    1     Location permission denied
      //    2     Network error
      //    408   Location timeout
      //
      getCurrentPosition: function (options) {
        var q = $q.defer();

        BackgroundGeolocation.getCurrentPosition(
          function successCb(result) {
            q.resolve(result);
          },
          function failureCb(err) {
            q.reject(err);
          },
          options
        );

        return q.promise;
      },

      // watchPosition   successFn, failureFn, {options}   Start a stream of continuous location-updates.
      watchPosition: function (options) {
        var q = $q.defer();

        BackgroundGeolocation.watchPosition(
          function successCb(result) {
            q.resolve(result);
          },
          function failureCb(err) {
            q.reject(err);
          }
        );

        return q.promise;
      },

      // stopWatchPosition   successFn, failureFn  Halt #watchPosition updates.
      stopWatchPosition: function () {
        var q = $q.defer();

        BackgroundGeolocation.stopWatchPosition(
          function successCb(result) {
            q.resolve(result);
          },
          function failureCb(err) {
            q.reject(err);
          }
        );

        return q.promise;
      },

      // changePace  Boolean, successFn  Toggles the plugin's state between stationary and moving.
      changePace: function () {
        var q = $q.defer();

        BackgroundGeolocation.stopWatchPosition(
          function successCb(result) {
            q.resolve(result);
          },
          function failureCb(err) {
            q.reject(err);
          }
        );

        return q.promise;
      },


      // getOdometer   callbackFn  The plugin constantly tracks distance travelled. The supplied callback will be executed and provided with the distance (meters) as the 1st parameter.
      getOdometer: function () {
        var q = $q.defer();
        return q.promise;
      },

      // setOdometer   Integer, callbackFn   Set the odometer to any arbitrary value. NOTE setOdometer will perform a getCurrentPosition in order to record to exact location where odometer was set; as a result, the callback signatures are identical to those of getCurrentPosition.
      setOdometer: function () {
        var q = $q.defer();
        return q.promise;
      },

      // resetOdometer   callbackFn  Reset the odometer to 0. Alias for setOdometer(0)
      resetOdometer: function () {
        var q = $q.defer();
        return q.promise;
      },

      // startSchedule   callbackFn  If a schedule was configured, this method will initiate that schedule.
      startSchedule: function () {
        var q = $q.defer();
        return q.promise;
      },

      // stopSchedule  callbackFn  This method will stop the Scheduler service. Your callbackFn will be executed after the Scheduler has stopped
      stopSchedule: function () {
        var q = $q.defer();
        return q.promise;
      },

      // removeListeners   none  Remove all events-listeners registered with #on method
      removeListeners: function () {
        var q = $q.defer();
        return q.promise;
      },

      // startBackgroundTask   callbackFn  Sends a signal to the native OS that you wish to perform a long-running task. The OS will not suspend your app until you signal completion with the #finish method.
      startBackgroundTask: function () {
        var q = $q.defer();
        return q.promise;
      },

      // finish  taskId  Sends a signal to the native OS the supplied taskId is complete and the OS may proceed to suspend your application if applicable.
      finish: function () {
        var q = $q.defer();
        return q.promise;
      },

      // isPowerSaveMode   callbackFn  Fetches the state of the operating-systems "Power Saving" mode, whether enabled or disabled
      isPowerSaveMode: function () {
        var q = $q.defer();
        return q.promise;
      },

      // GEOFENCE API

      // startGeofences  callbackFn  Engages the geofences-only trackingMode. In this mode, no active location-tracking will occur -- only geofences will be monitored
      startGeofences: function () {
        var q = $q.defer();

        BackgroundGeolocation.startGeofences(
          function (state) {
            q.resolve(state);
          },
          function (err) {
            q.reject(err);
          });
        
        return q.promise;
      },

      //
      // addGeofence(config, successFn, failureFn)
      //
      // Adds a geofence to be monitored by the native plugin. If a geofence already exists with the configured identifier, 
      // the previous one will be deleted before the new one is inserted.
      //
      // Config Options
      //
      // @config {String} identifier The name of your geofence, eg: "Home", "Office"
      // @config {Float} radius The radius (meters) of the geofence. In practice, you should make this >= 100 meters.
      // @config {Float} latitude Latitude of the center-point of the circular geofence.
      // @config {Float} longitude Longitude of the center-point of the circular geofence.
      // @config {Boolean} notifyOnExit Whether to listen to EXIT events
      // @config {Boolean} notifyOnEntry Whether to listen to ENTER events
      // @config {Boolean} notifyOnDwell Whether to listen to DWELL events
      // @config {Integer milliseconds} loiteringDelay When notifyOnDwell is true, the delay before DWELL event is fired after entering a geofence (@see Creating and Monitoring Geofences)
      // @config {Object} extras Optional arbitrary meta-data.
      //
      // successFn Parameters:
      // @param {String} identifier The name of your geofence, eg: "Home", "Office"
      //
      // failureFn Parameters
      // @param {String} errorMessage
      //
      addGeofence: function (config) {
        var q = $q.defer();

        BackgroundGeolocation.addGeofence(config,
          function (result) {
            q.resolve(result);
          },
          function (err) {
            q.reject(err);
          });

        return q.promise;
      },

      //
      // addGeofences  [geofences], sucessFn, failureFn  Adds a list geofences to be monitored by the native plugin.
      //
      // @param {Array} geofences An list of geofences configured with the same parmeters as #addGeofence
      // @param {Function} callbackFn Executed when geofences successfully added.
      // @param {Function} failureFn Executed when failed to add geofence.
      //
      // successFn Parameters:
      // @param {String} message
      //
      // failureFn Parameters:
      // @param {String} errorMessage
      //
      addGeofences: function (geofences) {
        var q = $q.defer();

        BackgroundGeolocation.addGeofences(geofences,
          function (result) {
            q.resolve(result);
          },
          function (err) {
            q.reject(err);
          });

        return q.promise;
      },

      //
      // removeGeofence(identifier, successFn, failureFn)
      //
      // Removes a geofence having the given {String} identifier.
      //
      // Config Options
      //
      // @config {String} identifier Identifier of geofence to remove.
      // @config {Function} callbackFn successfully removed geofence.
      // @config {Function} failureFn failed to remove geofence
      //
      // successFn Parameters:
      // @param {String} identifier
      //
      // failureFn Parameters:
      // @param {String} errorMessage
      //
      removeGeofence: function (identifier) {
        var q = $q.defer();

        BackgroundGeolocation.removeGeofence(identifier,
          function (result) {
            q.resolve(result);
          },
          function (err) {
            q.reject(err);
          });

        return q.promise;
      },

      //
      // removeGeofences(callbackFn, failureFn)
      //
      // Removes all geofences.
      // @config {Function} callbackFn successfully removed geofences.
      // @config {Function} failureFn failed to remove geofences
      //
      // successFn Parameters:
      // @param {String} message
      //
      // failureFn Parameters:
      // @param {String} errorMessage
      //
      removeGeofences: function () {
        var q = $q.defer();

        BackgroundGeolocation.removeGeofences(
          function (result) {
            q.resolve(result);
          },
          function (err) {
            q.reject(err);
          });

        return q.promise;
      },

      //
      // getGeofences(successFn, failureFn)
      //
      // Fetch the list of monitored geofences. Your successFn will be provided with an Array of geofences. If there are no geofences being monitored, you'll receive an empty Array [].
      // successFn Parameters
      // @param {Array} geofences List of all geofences in the database.
      //
      getGeofences: function () {
        var q = $q.defer();

        BackgroundGeolocation.getGeofences(
          function (result) {
            q.resolve(result);
          },
          function (err) {
            q.reject(err);
          });

        return q.promise;
      },

      // HTTP & PERSISTENCE API

      // getLocations  callbackFn  Fetch all the locations currently stored in native plugin's SQLite database. Your callbackFn will receive an Array of locations in the 1st parameter
      getLocations: function () {
        var q = $q.defer();
        return q.promise;
      },

      // getCount  callbackFn  Fetches count of SQLite locations table SELECT count(*) from locations
      getCount: function () {
        var q = $q.defer();
        return q.promise;
      },

      // destroyLocations  callbackFn  Delete all records in plugin's SQLite database
      destroyLocations: function () {
        var q = $q.defer();
        return q.promise;
      },

      // sync  successFn, failureFn  If the plugin is configured for HTTP with an #url and #autoSync: false, this method will initiate POSTing the locations currently stored in the native SQLite database to your configured #url
      sync: function () {
        var q = $q.defer();
        return q.promise;
      },

      // LOGGING METHODS

      // setLogLevel   Integer, callbackFn   Set the Log filter: LOG_LEVEL_OFF, LOG_LEVEL_ERROR, LOG_LEVEL_WARNING, LOG_LEVEL_INFO, LOG_LEVEL_DEBUG, LOG_LEVEL_VERBOSE
      setLogLevel: function (log_level) {
        var q = $q.defer();

        BackgroundGeolocation.setLogLevel(log_level,
          function () {
            return q.resolve();
          }
        );

        return q.promise;
      },

      // getLog  callbackFn  Fetch the entire contents of the current log database as a String.
      getLog: function () {
        var q = $q.defer();

        BackgroundGeolocation.getLog(
          function (log) {
            q.resolve(log);
          }
        );

        return q.promise;
      },
      
      // destroyLog  callbackFn, failureFn   Destroy the contents of the Log database.
      destroyLog: function () {
        var q = $q.defer();

        BackgroundGeolocation.destroyLog(
          function () {
            return q.resolve();
          },
          function () {
            return q.reject();
          }
        );

        return q.promise;
      },
      
      // emailLog  email, callbackFn   Fetch the entire contents of Log database and email it to a recipient using the device's native email client.
      emailLog: function (recipient) {
        var q = $q.defer();

        BackgroundGeolocation.emailLog(recipient,
          function () {
            q.resolve();
          }
        );

        return q.promise;
      },
      
      // getSensors  callbackFn, failureFn   Returns the presense of device sensors accelerometer, gyroscope, magnetometer, in addition to iOS/Android-specific sensors
      getSensors: function () {
        var q = $q.defer();
        return q.promise;
      },

      // playSound   Integer   Here's a fun one. The plugin can play a number of OS system sounds for each platform. For IOS and Android. I offer this API as-is, it's up to you to figure out how this works.
      playSound: function () {
        var q = $q.defer();
        return q.promise;
      },
      
      logger: {
        // logger.error  message   Record a :exclamation: log message into the plugin's log database.
        error: function () {
          var q = $q.defer();



          return q.promise;
        },
        // logger.warn   message   Record a :warning: log message into the plugin's log database.
        warn: function () {
          var q = $q.defer();
          return q.promise;
        },
        // logger.debug  message   Record a :beetle: log message into the plugin's log database.
        debug: function () {
          var q = $q.defer();
          return q.promise;
        },
        // logger.info   message   Record a :information_source: log message into the plugin's log database.
        info: function () {
          var q = $q.defer();
          return q.promise;
        },
        // logger.notice   message   Record a :large_blue_circle: log message into the plugin's log database.
        notice: function () {
          var q = $q.defer();
          return q.promise;
        },
        // logger.header   message   Record a header log message into the plugin's log database.
        header: function () {
          var q = $q.defer();
          return q.promise;
        },
        // logger.on   message   Record a :tennis: log message into the plugin's log database.
        on: function () {
          var q = $q.defer();
          return q.promise;
        },
        // logger.off  message   Record a :red_circle: log message into the plugin's log database.
        off: function () {
          var q = $q.defer();
          return q.promise;
        },
        // logger.ok   message   Record a :white_check_mark: log message into the plugin's
        ok: function () {
          var q = $q.defer();
          return q.promise;
        }
      }
    };
  }
]);

})();

// setLogLevel   Integer, callbackFn   Set the Log filter: LOG_LEVEL_OFF, LOG_LEVEL_ERROR, LOG_LEVEL_WARNING, LOG_LEVEL_INFO, LOG_LEVEL_DEBUG, LOG_LEVEL_VERBOSE
// getLog  callbackFn  Fetch the entire contents of the current log database as a String.
// destroyLog  callbackFn, failureFn   Destroy the contents of the Log database.
// emailLog  email, callbackFn   Fetch the entire contents of Log database and email it to a recipient using the device's native email client.
// getSensors  callbackFn, failureFn   Returns the presense of device sensors accelerometer, gyroscope, magnetometer, in addition to iOS/Android-specific sensors
// logger.error  message   Record a :exclamation: log message into the plugin's log database.
// logger.warn   message   Record a :warning: log message into the plugin's log database.
// logger.debug  message   Record a :beetle: log message into the plugin's log database.
// logger.info   message   Record a :information_source: log message into the plugin's log database.
// logger.notice   message   Record a :large_blue_circle: log message into the plugin's log database.
// logger.header   message   Record a header log message into the plugin's log database.
// logger.on   message   Record a :tennis: log message into the plugin's log database.
// logger.off  message   Record a :red_circle: log message into the plugin's log database.
// logger.ok   message   Record a :white_check_mark: log message into the plugin's
// playSound   Integer   Here's a fun one. The plugin can play a number of OS system sounds for each platform. For IOS and Android. I offer this API as-is, it's up to you to figure out how this works.