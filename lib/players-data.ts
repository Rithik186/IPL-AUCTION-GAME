// IPL 2025 Players Database (Data from user input)
export interface Player {
  id: string
  name: string
  role: "Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper"
  category: "Capped" | "Uncapped" | "Overseas"
  basePrice: number // in Lakhs
  nationality: string
  team?: string
  stats: {
    matches?: number
    runs?: number
    wickets?: number
    average?: number
    strikeRate?: number
    economy?: number
  }
  image: string
  points: number // Added point value out of 100 for each player
}

const calculatePlayerPoints = (basePrice: number, role: string, category: string): number => {
  let basePoints = 30 // Minimum points

  // Points based on base price
  if (basePrice >= 200)
    basePoints += 40 // Premium players
  else if (basePrice >= 150) basePoints += 30
  else if (basePrice >= 100) basePoints += 20
  else if (basePrice >= 75) basePoints += 15
  else if (basePrice >= 50) basePoints += 10

  // Role-based bonus
  if (role === "All-Rounder")
    basePoints += 15 // Most valuable
  else if (role === "Wicket-Keeper") basePoints += 10
  else if (role === "Bowler") basePoints += 8
  else basePoints += 5 // Batsman

  // Category bonus
  if (category === "Overseas") basePoints += 10
  else if (category === "Capped") basePoints += 5

  return Math.min(100, basePoints) // Cap at 100
}

/**
 * Helper function to parse the price string into a number (in lakhs).
 */
const parsePrice = (priceStr: string): number => {
  const lowerCasePrice = priceStr.toLowerCase()
  if (lowerCasePrice.includes("traded")) {
    return 0
  }

  const numericValue = Number.parseFloat(lowerCasePrice.replace(/[^0-9.]/g, ""))
  if (isNaN(numericValue)) {
    return 0
  }

  if (lowerCasePrice.includes("crore") || lowerCasePrice.includes("cr")) {
    return numericValue * 100
  }
  if (lowerCasePrice.includes("lakh")) {
    return numericValue
  }
  return 0
}

/**
 * Helper function to normalize player roles.
 */
const normalizeRole = (roleStr: string): "Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper" => {
  const role = roleStr.trim().toLowerCase()
  if (role.includes("wk-batsman") || role.includes("wt-batsman")) {
    return "Wicket-Keeper"
  }
  if (role.includes("all-rounder") || role.includes("allrounder")) {
    return "All-Rounder"
  }
  if (role.includes("bowler")) {
    return "Bowler"
  }
  if (role.includes("batsman") || role.includes("batter") || role.includes("batman")) {
    return "Batsman"
  }
  return "All-Rounder"
}

/**
 * Helper function to normalize player names by removing suffixes.
 */
const normalizeName = (nameStr: string): string => {
  return nameStr.replace(/\s*$$(c|wk|c&wk|vc)$$$/i, "").trim()
}

/**
 * FINAL RECOMMENDED FUNCTION: Always looks for '1.jpg'.
 * This is the most reliable method and requires you to name one file
 * in each player's folder '1.jpg'.
 */
const generateImagePath = (originalName: string, team: string): string => {
  // Path points to your 'public/PROJECT' folder.
  const baseImagePath = "/PROJECT"
  const playerFolderName = `Images_${originalName.trim()}`

  // The code will ALWAYS look for this exact filename.
  const imageFileName = "1.jpg"

  return `${baseImagePath}/${team.trim()}/${playerFolderName}/${imageFileName}`
}

// Raw data provided by the user
const rawPlayerData = `
Aiden Markram(C),Batsman,INR 2.60 Crores(R),South Africa,SRH
Rahul Tripathi,Batsman,INR 8.50 Crores(R),India,SRH
Glenn Phillips (wk),WK-Batsman,INR 1.50 Crores(R),New Zealand,SRH
Umran Malik,Bowler,INR 4Cr(R),India,SRH
Fazal Haq Farooqi,Bowler,INR 50 Lakhs(R),Afghanistan,SRH
Kartik Tyagi,Bowler,INR 4 Crores(R),India,SRH
T Natarajan,Bowler,INR 4 Crores(R),India,SRH
Bhuvneshwar Kumar,Bowler,INR 4.20 Crores(R),India,SRH
Abdul Samad,All-rounder,INR 4Cr(R),India,SRH
Marco Jansen,All-rounder,INR 4.20 Crores(R),South Africa,SRH
Abhishek Sharma,All-rounder,INR 6.50 Crores(R),India,SRH
Washington Sundar,All-rounder,INR 8.75 Crores(R),India,SRH
Harry Brook,Batsman,INR 13.25 crore,England,SRH
Mayank Agarwal,Batsman,INR 8.25 crores,India,SRH
Heinrich Klaasen,WK-Batsman,INR 5.25 crore,South Africa,SRH
Adil Rashid,Bowler,INR 2 crore,England,SRH
Mayank Markande,Bowler,INR 50 lakh,India,SRH
Vivrant Sharma,All-rounder,INR 2.6 crore,India,SRH
Samarth Vyas,All-rounder,INR 20 lakh,India,SRH
Sanvir Singh,All-rounder,INR 20 lakh,India,SRH
Upendra Yadav,WK-Batsman,INR 25 lakh,India,SRH
Mayank Dagar,All-rounder,INR 1.8 crore,India,SRH
Nitish Kumar Reddy,WK-Batsman,INR 20 lakh,India,SRH
Akeal Hosein,Bowler,INR 1 crore,West Indies,SRH
Anmolpreet Singh,Batman,INR 20 lakh,India,SRH
Virat Kohli,Batsman,INR 15 CR(R),India,RCB
Suyash Prabhudessai,Batsman,INR 30 Lakhs(R),India,RCB
Faf du Plessis(C),Batsman,INR 7 crores(R),South Africa,RCB
Rajat Patidar,Batsman,INR 20 Lakhs(R),India,RCB
Anuj Rawat (wk),WK-Batsman,INR 3.40 crores(R),India,RCB
Finn Allen (wk),WK-Batsman,INR 80 Lakhs(R),New Zealand,RCB
Dinesh Karthik (wk),WK-Batsman,INR 5.50 crores(R),India,RCB
Mohammed Siraj,Bowler,INR 7 CR(R),India,RCB
Karn Sharma,Bowler,INR 50 Lakhs(R),India,RCB
Siddarth Kaul,Bowler,INR 75 Lakhs(R),India,RCB
Josh Hazlewood,Bowler,INR 7.75 crores(R),Australia,RCB
Harshal Patel,Bowler,INR 10.75 crores(R),India,RCB
Akash Deep,Bowler,INR 20 Lakhs(R),India,RCB
Glenn Maxwell,All-rounder,INR 11 CR(R),Australia,RCB
David Willey,All-rounder,INR 2 crores(R),England,RCB
Mahipal Lomror,All-rounder,INR 95 Lakhs(R),India,RCB
Shahbaz Ahmed,All-rounder,INR 2.40 crores(R),India,RCB
Wanindu Hasaranga,All-rounder,INR 10.75 crores(R),Sri Lanka,RCB
Reece Topley,Bowler,INR 1.90 crores,England,RCB
Will Jacks,Allrounder,INR 3.20 crores,England,RCB
Himanshu Sharma,Bowler,INR 20 Lakhs,India,RCB
Manoj Bhandage,Allrounder,INR 20 Lakhs,India,RCB
Rajan Kumar,Bowler,INR 70 Lakhs,India,RCB
Avinash Singh,Bowler,INR 60 Lakhs,India,RCB
R Sonu Yadav,Allrounder,INR 20 Lakhs,India,RCB
Yashasvi Jaiswal,Batsman,INR 4 Crores(R),India,RR
Devdutt Padikkal,Batsman,INR 7.75 Crores(R),India,RR
Shimron Hetmyer,Batsman,INR 8.50 Crores(R),West Indies,RR
Sanju Samson (c&wk),WK-Batsman,INR 14 Cr(R),India,RR
Jos Buttler (wk),WK-Batsman,INR 10 Cr(R),England,RR
Dhruv Jurel (wk),WK-Batsman,INR 20 Lakhs(R),India,RR
Kuldip Yadav,Bowler,INR 20 Lakhs(R),India,RR
Navdeep Saini,Bowler,INR 2.60 Crores(R),India,RR
Kuldeep Sen,Bowler,INR 20 Lakhs(R),India,RR
Obed McCoy,Bowler,INR 75 Lakhs(R),West Indies,RR
KC Kariappa,Bowler,INR 30 Lakhs(R),India,RR
Yuzvendra Chahal,Bowler,INR 6.50 Crores(R),India,RR
Prasidh Krishna,Bowler,INR 10 Crores(R),India,RR
Trent Boult,Bowler,INR 8 Crores(R),New Zealand,RR
Riyan Parag,All-rounder,INR 3.80 Crores(R),India,RR
Ravichandran Ashwin,All-rounder,INR 5 Crores(R),India,RR
Jason Holder,All-rounder,INR 5.75 crore,West Indies,RR
Donovan Ferreira,WK-Batsman,INR 50 lakh,South Africa,RR
Kunal Rathore,WK-Batsman,INR 20 lakh,India,RR
Adam Zampa,Bowler,INR 1.5 crore,Australia,RR
KM Asif,Bowler,INR 30 lakh,India,RR
Murugan Ashwin,Bowler,INR 20 lakh,India,RR
Akash Vashisht,All-rounder,INR 20 lakh,India,RR
Abdul P A,Bowler,INR 20 lakh,India,RR
Joe Root,Batter,INR 1 crore,England,RR
Bhanuka Rajapaksa,Batsman,INR 50 Lakhs(R),Sri Lanka,PBKS
Shahrukh Khan,Batsman,INR 9 Crores(R),India,PBKS
Shikhar Dhawan(C),Batsman,INR 8.25 Crores(R),India,PBKS
Prabhsimran Singh (wk),WK-Batsman,INR 60 Lakhs(R),India,PBKS
Jitesh Sharma (wk),WK-Batsman,INR 20 Lakhs(R),India,PBKS
Jonny Bairstow (wk),WK-Batsman,INR 6.75 crores(R),England,PBKS
Arshdeep Singh,Bowler,INR 4 Cr(R),India,PBKS
Raj Bawa,Bowler,INR 2 Crores(R),India,PBKS
Nathan Ellis,Bowler,INR 75 Lakhs(R),Australia,PBKS
Harpreet Brar,Bowler,INR 3.80 Crores(R),India,PBKS
Rahul Chahar,Bowler,INR 5.25 Crores(R),India,PBKS
Kagiso Rabada,Bowler,INR 9.25 Crores(R),South Africa,PBKS
Baltej Singh,All-rounder,INR 20 Lakhs(R),India,PBKS
Liam Livingstone,All-rounder,INR 11.50 Crores(R),England,PBKS
Rishi Dhawan,All-rounder,INR 55 Lakhs(R),India,PBKS
Atharva Taide,All-rounder,INR 20 Lakhs(R),India,PBKS
Sam Curran,All-rounder,INR 18.50 crores,England,PBKS
Sikandar Raza,All-rounder,INR 50 lakh,Zimbabwe,PBKS
Harpreet Bhatia,Batsman,INR 40 lakh,India,PBKS
Vidwath Kaverappa,Bowler,INR 20 lakh,India,PBKS
Mohit Rathee,All-rounder,INR 20 lakh,India,PBKS
Shivam Singh,All-rounder,INR 20 lakh,India,PBKS
Rohit Sharma (c),Batsman,INR 16 Cr(R),India,MI
Suryakumar Yadav,Batsman,INR 8 Cr(R),India,MI
Tilak Varma,Batsman,INR 1.70 Cr(R),India,MI
Ramandeep Singh,Batsman,INR 20 Lakhs(R),India,MI
Dewald Brevis,Batsman,INR 3 crores(R),South Africa,MI
Ishan Kishan (wk),WK-Batsman,INR 15.25 crores(R),India,MI
Jasprit Bumrah,Bowler,INR 12 Cr(R),India,MI
Kumar Kartikeya Singh,Bowler,INR 20 Lakhs(R),India,MI
Jofra Archer,Bowler,INR 8 crores(R),England,MI
Hrithik Shokeen,All-rounder,INR 20 Lakhs(R),India,MI
Arjun Tendulkar,All-rounder,INR 30 Lakhs(R),India,MI
Tim David,All-rounder,INR 8.25 Crores(R),Singapore,MI
Tristan Stubbs,WK-Batsman,INR 20 lakhs(R),South Africa,MI
Arshad Khan,All-rounder,INR 20 lakhs(R),India,MI
Akash Madhwal,Bowler,INR 20 lakhs(R),India,MI
Jason Behrendorff,Bowler,Traded from RCB,Australia,MI
Cameron Green,All-rounder,INR 17.50 crores,Australia,MI
Jhye Richardson,Bowler,INR 1.50 crore,Australia,MI
Piyush Chawla,Bowler,INR 50 Lakhs,India,MI
Duan Jansen,All-rounder,INR 20 Lakhs,South Africa,MI
Shams Mulani,All-rounder,INR 20 Lakhs,India,MI
Nehal Wadhera,All-rounder,INR 20 Lakhs,India,MI
Vishnu Vinod,WK-Batsman,INR 20 Lakhs,India,MI
Raghav Goyal,Bowler,INR 20 Lakhs,India,MI
Manan Vohra,Batsman,INR 20 Lakhs(R),India,LSG
KL Rahul (c&wk),WK-Batsman,INR 17 Crores(R),India,LSG
Quinton de Kock (wk),WK-Batsman,INR 6.75 Crores(R),South Africa,LSG
Ravi Bishnoi,Bowler,INR 4 Crores(R),India,LSG
Mohsin Khan,Bowler,INR 20 Lakhs(R),India,LSG
Mayank Yadav,Bowler,INR 20 Lakhs(R),India,LSG
Avesh Khan,Bowler,INR 10 Crores(R),India,LSG
Marcus Stoinis,All-rounder,INR 9.2 Crores(R),Australia,LSG
Kyle Mayers,All-rounder,INR 50 Lakhs(R),West Indies,LSG
Karan Sharma,All-rounder,INR 20 Lakhs(R),India,LSG
K Gowtham,All-rounder,INR 90 Lakhs(R),India,LSG
Ayush Badoni,All-rounder,INR 20 Lakhs(R),India,LSG
Deepak Hooda,All-rounder,INR 5.75 Crores(R),India,LSG
Krunal Pandya,All-rounder,INR 8.25 Crores(R),India,LSG
Nicholas Pooran,WK-Batsman,INR 16 crore,West Indies,LSG
Jaydev Unadkat,Bowler,INR 50 lakh,India,LSG
Yash Thakur,Bowler,INR 45 lakh,India,LSG
Romario Shepherd,All-rounder,INR 50 lakh,West Indies,LSG
Daniel Sams,All-rounder,INR 75 lakh,Australia,LSG
Amit Mishra,Bowler,INR 50 lakh,India,LSG
Prerak Mankad,All-rounder,INR 20 lakh,India,LSG
Swapnil Singh,All-rounder,INR 20 lakh,India,LSG
Naveen-ul-Haq,Bowler,INR 50 lakh,Afghanistan,LSG
Yudhvir Charak,All-rounder,INR 20 lakh,India,LSG
Shreyas Iyer,Batsman,INR 12.25 Crores(R),India,KKR
Nitish Rana,Batsman,INR 8 crores(R),India,KKR
Rinku Singh,Batsman,INR 55 Lakhs(R),India,KKR
Varun Chakravarty,Bowlers,INR 8 Cr(R),India,KKR
Tim Southee,Bowlers,INR 1.5 crores(R),New Zealand,KKR
Umesh Yadav,Bowlers,INR 2 crores(R),India,KKR
Andre Russell,All-rounder,INR 12 Cr(R),West Indies,KKR
Venkatesh Iyer,All-rounder,INR 8 Cr(R),India,KKR
Sunil Narine,All-rounder,INR 6 Cr(R),West Indies,KKR
Anukul Roy,All-rounder,INR 20 Lakhs(R),India,KKR
Shardul Thakur,Bowler,Traded from DC,India,KKR
Lockie Ferguson,Bowler,Traded from GT,New Zealand,KKR
Rahmanullah Gurbaz,WK-Batsman,Traded from DC,Afghanistan,KKR
Harshit Rana,Bowler,INR 20 Lakhs(R),India,KKR
N. Jagadeesan,WK-Batsman,INR 90 lakh,India,KKR
Vaibhav Arora,Bowler,INR 60 lakh,India,KKR
Suyash Sharma,Bowler,INR 20 lakh,India,KKR
David Wiese,All-rounder,INR 1 crore,Namibia,KKR
Kulwant Khejroliya,Bowler,INR 20 lakh,India,KKR
Litton Das,WK-batsman,INR 50 lakh,Bangladesh,KKR
Mandeep Singh,Batsman,INR 50 lakh,India,KKR
Shakib Al Hasan,All-rounder,INR 1.5 crore,Bangladesh,KKR
Shubman Gill,Batsman,INR 8 Crores(R),India,GT
Sai Sudarshan,Batsman,INR 20 Lakhs(R),India,GT
Abhinav Sadarangani,Batsman,INR 2.60 Crores(R),India,GT
David Miller,Batsman,INR 3 crores(R),South Africa,GT
Matthew Wade (wk),WK-Batsman,INR 2.40 Crores(R),Australia,GT
Wriddhiman Saha (wk),WK-Batsman,INR 1.90 Crores(R),India,GT
Rashid Khan,Bowler,INR 15 Crores(R),Afghanistan,GT
Darshan Nalkande,Bowler,INR 20 Lakhs(R),India,GT
Yash Dayal,Bowler,INR 3.20 Crores(R),India,GT
Pradeep Sangwan,Bowler,INR 20 Lakhs(R),India,GT
Alzarri Joseph,Bowler,INR 2.40 Crores(R),West Indies,GT
R Sai Kishore,Bowler,INR 3 Crores(R),India,GT
Noor Ahmad,Bowler,INR 30 Lakhs(R),Afghanistan,GT
Mohammed Shami,Bowler,INR 6.25 Crores(R),India,GT
Hardik Pandya,All-rounder,INR 15 Crores(R),India,GT
Vijay Shankar,All-rounder,INR 1.40 Crores(R),India,GT
Jayant Yadav,All-rounder,INR 1.70 Crores(R),India,GT
Rahul Tewatia,All-rounder,INR 9 Crores(R),India,GT
Kane Williamson,Batsman,INR 2 crore,New Zealand,GT
Odean Smith,All-rounder,INR 50 lakh,West Indies,GT
KS Bharat,WK-Batsman,INR 1.2 crore,India,GT
Shivam Mavi,Bowler,INR 6 crore,India,GT
Urvil Patel,WK-Batsman,INR 20 lakh,India,GT
Joshua Little,Bowler,INR 4.4 crore,Ireland,GT
Mohit Sharma,Bowler,INR 50 lakh,India,GT
Rishabh Pant (wk),WT-Batsman,INR 16 Cr(R),India,DC
Prithvi Shaw,Batsman,INR 7.50Cr(R),India,DC
David Warner(C),Batsman,INR 6.25 Crores(R),Australia,DC
Sarfaraz Khan,Batsman,INR 20 Lakhs(R),India,DC
Yash Dhull,Batsman,INR 50 Lakhs(R),India,DC
Rovman Powell,Batsman,INR 2.80 crores(R),West Indies,DC
Anrich Nortje,Bowler,INR 6.50 Cr(R),South Africa,DC
Kamlesh Nagarkoti,Bowler,INR 1.10 crores(R),India,DC
Mustafizur Rahman,Bowler,INR 2 crores(R),Bangladesh,DC
Lungi Ngidi,Bowler,INR 50 Lakhs(R),South Africa,DC
Khaleel Ahmed,Bowler,INR 5.25 crores(R),India,DC
Chetan Sakariya,Bowler,INR 4.20 crores(R),India,DC
Praveen Dubey,Bowler,INR 50 Lakhs(R),India,DC
Kuldeep Yadav,Bowler,INR 2 crores(R),India,DC
Axar Patel(vc),All-rounder,INR 9 crores(R),India,DC
Mitchell Marsh,All-rounder,INR 6.50 Crores(R),Australia,DC
Lalit Yadav,All-rounder,INR 65 Lakhs(R),India,DC
Ripal Patel,All-rounder,INR 20 Lakhs(R),India,DC
Vicky Ostwal,All-rounder,INR 20 Lakh(R),India,DC
Aman Khan,Allrounder,Traded from KKR,India,DC
Ishant Sharma,Bowler,INR 50 lakh,India,DC
Phil Salt,WT-Batsman,INR 2 crores,England,DC
Mukesh Kumar,Bowler,INR 5.5 crores,India,DC
Manish Pandey,Batsman,INR 2.4 crores,India,DC
Rilee Rossouw,Batsman,INR 4.6 crores,South Africa,DC
MS Dhoni (wk),WK-Batsman,INR 12 Cr(R),India,CSK
Ruturaj Gaikwad,Batsman,INR 6 Cr(R),India,CSK
Ambati Rayudu (wk),WK- Batsman,INR 6.75 crores(R),India,CSK
Devon Conway,Batsman,INR 1 crores(R),New Zealand,CSK
Subhranshu Senapati,Batsman,INR 20 Lakhs(R),India,CSK
Deepak Chahar,Bowler,INR 14 crores(R),India,CSK
Tushar Deshpande,Bowler,INR 20 Lakhs(R),India,CSK
Maheesh Theekshana,Bowler,INR 70 Lakhs(R),Sri Lanka,CSK
Simranjeet Singh,Bowler,INR 20 Lakhs(R),India,CSK
Matheesha Pathirana,Bowler,INR 20 Lakhs(R),Sri Lanka,CSK
Mukesh Choudhary,Bowler,INR 20 Lakhs(R),India,CSK
Prashant Solanki,Bowler,INR 1.20 crores(R),India,CSK
Mitchell Santner,Bowler,INR 1.90 crores(R),New Zealand,CSK
Rajvardhan Hangargekar,Bowler,INR 1.50 crores(R),India,CSK
Ravindra Jadeja(C),All-rounder,INR 16 Cr(R),India,CSK
Moeen Ali,All-rounder,INR 8 Cr(R),England,CSK
Shivam Dube,All-rounder,INR 4 crores(R),India,CSK
Dwaine Pretorius,All-rounder,INR 50 Lakhs(R),South Africa,CSK
Ben Stokes,All-rounder,INR 16.25 Crores,England,CSK
A Rahane,Batsman,INR 50 Lakhs,India,CSK
Kyle Jamieson,Bowler,INR 1 crore,New Zealand,CSK
Nishant Sindhu,All-rounder,INR 20 Lakhs,India,CSK
Shaik Rasheed,Batsman,INR 20 Lakhs,India,CSK
Ajay Mandal,Bowler,INR 20 Lakhs,India,CSK
Bhagath Verma,All-rounder,INR 20 Lakhs,India,CSK
`

export const playersDatabase: Player[] = rawPlayerData
  .trim()
  .split("\n")
  .map((line, index) => {
    const parts = line.split(",")
    const originalName = parts[0]
    const role = parts[1]
    const price = parts[2]
    const nationality = parts[3]
    const team = parts[4]

    const category = nationality.trim().toLowerCase() === "india" ? "Capped" : "Overseas"
    const basePrice = parsePrice(price)
    const normalizedRole = normalizeRole(role)

    return {
      id: (index + 1).toString(),
      name: normalizeName(originalName), // Clean name for display
      role: normalizedRole,
      category: category,
      basePrice: basePrice,
      nationality: nationality.trim(),
      team: team.trim(),
      stats: {}, // Stats are not available in the provided data
      image: generateImagePath(originalName, team), // Generate dynamic image path
      points: calculatePlayerPoints(basePrice, normalizedRole, category), // Add points for leaderboard
    }
  })

export const getPlayersByCategory = (category: string) => {
  return playersDatabase.filter((player) => player.category === category)
}

export const getPlayersByRole = (role: string) => {
  return playersDatabase.filter((player) => player.role === role)
}
