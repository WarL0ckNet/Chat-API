/**
 * ant declarations.
 */

module.exports = {
    CONNECTED_STATUS: 'connected',                                                    // Describes the connection status with the WhatsApp server.
    DISCONNECTED_STATUS: 'disconnected',                                              // Describes the connection status with the WhatsApp server.
    MEDIA_FOLDER: 'media',                                                            // The relative folder to store received media files
    PICTURES_FOLDER: 'pictures',                                                      // The relative folder to store picture files
    DATA_FOLDER: 'wadata',                                                            // The relative folder to store cache files.
    PORT: 443,                                                                        // The port of the WhatsApp server.
    TIMEOUT_SEC: 2,                                                                   // The timeout for the connection with the WhatsApp servers.
    TIMEOUT_USEC: 0,
    WHATSAPP_CHECK_HOST: 'v.whatsapp.net/v2/exist',                                   // The check credentials host.
    WHATSAPP_GROUP_SERVER: 'g.us',                                                    // The Group server hostname
    WHATSAPP_REGISTER_HOST: 'v.whatsapp.net/v2/register',                             // The register code host.
    WHATSAPP_REQUEST_HOST: 'v.whatsapp.net/v2/code',                                  // The request code host.
    WHATSAPP_SERVER: 's.whatsapp.net',                                                // The hostname used to login/send messages.
    DEVICE: 'armani',                                                                 // The device name.
    WHATSAPP_VER: '2.18.302',                                                         // The WhatsApp version.
    OS_VERSION: '4.3',
    MANUFACTURER: 'Xiaomi',
    BUILD_VERSION: 'JLS36C',
    PLATFORM: 'Android',                                                              // The device name.
    WHATSAPP_USER_AGENT: 'WhatsApp/2.16.148 Android/4.3 Device/Xiaomi-HM_1SW',        // User agent used in request/registration code.
    WHATSAPP_VER_CHECKER: 'https://coderus.openrepos.net/whitesoft/whatsapp_scratch' // Check WhatsApp version
}