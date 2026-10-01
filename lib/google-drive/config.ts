export const driveFolderIds = {
  root: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "12V7050zJAevf08QgsH35ddoguvwte-k6",
  public: process.env.GOOGLE_DRIVE_PUBLIC_FOLDER_ID || "1fXOYAYYXO0Njq5n-dNnNZq4W1vsfOCZI",
  private: process.env.GOOGLE_DRIVE_PRIVATE_FOLDER_ID || "12GzdWTib14KYwvp5hI4x8wVwoST6YUsC",
  news: "1cfHVlLDTKkvIchnuGCrt8EHWhlX4G1c_",
  events: "1g2TcdMnCW0nhbW_8Dtl2yQ1fEJq93MaQ",
  pages: "1LTzps-t6_tAM5fVhiDN7sCxZA9qM8CkU",
  locations: "1Yju3THvHnhUpu54zYcw-l-lnW-jzQVG5",
  instructors: "1vz_AuVcpn5QcfTxh3zKEAarEr2MIVUg2",
  archive: "1Xe3ARXtZiFoBorvJlv-iIWRRJHsu0rq5",
  profiles: "14EhI2U2A_4OAJR3rVxptFoT0NQb6Hu5c",
} as const;

export type DriveFolderMap = Record<keyof typeof driveFolderIds, string>;

export type DriveMediaCategory = keyof Omit<typeof driveFolderIds, "root" | "public" | "private">;
