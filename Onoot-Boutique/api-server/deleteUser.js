import { MongoClient } from "mongodb";

const MONGO_URI = "mongodb://localhost:27017/onootboutique";

async function deleteUser(email) {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db("onootboutique");
    const result = await db.collection("users").deleteOne({ email });
    if (result.deletedCount > 0) {
      console.log(`✅ Utilisateur "${email}" supprimé avec succès.`);
    } else {
      console.log(`⚠️  Aucun utilisateur trouvé avec l'email "${email}".`);
    }

    // Lister tous les utilisateurs restants
    const users = await db.collection("users").find({}).project({ email: 1, firstName: 1, lastName: 1, role: 1 }).toArray();
    console.log(`\nUtilisateurs en base (${users.length}) :`);
    users.forEach(u => console.log(`  - ${u.email} (${u.firstName} ${u.lastName}) [${u.role}]`));
  } finally {
    await client.close();
  }
}

const emailToDelete = process.argv[2];
if (!emailToDelete) {
  console.error("Usage: node deleteUser.js <email>");
  process.exit(1);
}

deleteUser(emailToDelete).catch(console.error);
