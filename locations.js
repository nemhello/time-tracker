// Edit charge codes and addresses here
// Format: { name: "Name", chargeCode: "SZ02B04D33", address: "123 Main St, City, MO 64101" }
const CATEGORIES = {
    "Tower Sites": [
        { name: "Bennington", chargeCode: "SZ02B04D33", address: "11231 Bennington Ave, Kansas City, MO 64134" },
        { name: "Booth", chargeCode: "SZ02B04D34", address: "6801 Booth St, Kansas City, MO 64133" },
        { name: "City Hall", chargeCode: "SZ02B04D35", address: "414 E 12th ST, Kansas City, MO 64106" },
        { name: "Clay County", chargeCode: "SZ02B04D36", address: "16616 NE 116 ST, Kearney, MO 64060" },
        { name: "Fleet", chargeCode: "SZ02B04D37", address: "5301 E 27 ST, Kansas City, MO 64127" },
        { name: "KCI", chargeCode: "SZ02B04D38", address: "9205 NW 112 ST, Kansas City, MO 64153" },
        { name: "North Patrol (Barry)", chargeCode: "SZ02B04D39", address: "1001 NW Barry RD, Kansas City, MO 64154" },
        { name: "Plaza/UMKC", chargeCode: "SZ02B04D40", address: "988 E 52 ST, Kansas City, MO 64110" },
        { name: "Riverside", chargeCode: "SZ02B04D41", address: "4191-4399 NW Tullison RD, Kansas City, MO 64150" },
        { name: "Tower Park", chargeCode: "SZ02B04D42", address: "7500 Holmes RD, Kansas City, MO 64131" },
        { name: "Worlds of Fun", chargeCode: "SZ02B04D43", address: "4923 N Winchester AVE, Kansas City, MO 64119" }
    ],
    "Police Stations": [
        { name: "Riverside PD", chargeCode: "SZ02B04D44", address: "2990 NW Vivion RD, Riverside, MO 64150" },
        { name: "MCI PD", chargeCode: "SZ02B04D44", address: "1 Internation Square, Kansas City, MO 64153" }
    ],
    "Fire Stations": [
        { name: "FD #36", chargeCode: "SZ02B04D45", address: "9903 Holmes RD, Kansas City, MO 64131" },
        { name: "ARF", chargeCode: "SZ02B04D44", address: "466-470 Paris ST, Kansas City, MO 64153" }
    ]
};
