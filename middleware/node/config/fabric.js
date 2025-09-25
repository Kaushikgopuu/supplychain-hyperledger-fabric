const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class FabricService {
  constructor() {
    this.channelName = process.env.CHANNEL_NAME || 'supplychainchannel';
    this.chaincodeName = process.env.CHAINCODE_NAME || 'supplychain';
    this.walletPath = path.join(__dirname, '..', process.env.WALLET_PATH || 'wallet');
    this.orgName = process.env.ORG_NAME || 'manufacturer';
    this.orgDomain = process.env.ORG_DOMAIN || 'manufacturer.supplychain.com';
    this.mspId = process.env.MSP_ID || 'ManufacturerMSP';
    this.gateway = null;
    this.wallet = null;
  }

  async initialize() {
    try {
      // Create wallet
      this.wallet = await Wallets.newFileSystemWallet(this.walletPath);
      
      // Check if admin exists, if not create it
      const adminExists = await this.wallet.get('admin');
      if (!adminExists) {
        await this.enrollAdmin();
      }

      logger.info('Fabric service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Fabric service:', error);
      throw error;
    }
  }

  async enrollAdmin() {
    try {
      const caInfo = this.getCaInfo();
      const caTLSCACerts = caInfo.tlsCACerts;
      const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

      const enrollment = await ca.enroll({
        enrollmentID: process.env.ADMIN_USER_ID || 'admin',
        enrollmentSecret: process.env.ADMIN_PASSWORD || 'adminpw'
      });

      const x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: this.mspId,
        type: 'X.509',
      };

      await this.wallet.put('admin', x509Identity);
      logger.info('Successfully enrolled admin user and imported to wallet');
    } catch (error) {
      logger.error('Failed to enroll admin user:', error);
      throw error;
    }
  }

  async registerUser(userId, userRole = 'client') {
    try {
      const userExists = await this.wallet.get(userId);
      if (userExists) {
        logger.info(`User ${userId} already exists in wallet`);
        return;
      }

      const gateway = new Gateway();
      const connectionProfile = this.getConnectionProfile();
      
      await gateway.connect(connectionProfile, {
        wallet: this.wallet,
        identity: 'admin',
        discovery: { enabled: true, asLocalhost: true }
      });

      const ca = gateway.getClient().getCertificateAuthority();
      const adminIdentity = gateway.getCurrentIdentity();

      const secret = await ca.register({
        affiliation: `${this.orgName}.department1`,
        enrollmentID: userId,
        role: userRole
      }, adminIdentity);

      const enrollment = await ca.enroll({
        enrollmentID: userId,
        enrollmentSecret: secret
      });

      const x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: this.mspId,
        type: 'X.509',
      };

      await this.wallet.put(userId, x509Identity);
      await gateway.disconnect();

      logger.info(`Successfully registered and enrolled user ${userId}`);
    } catch (error) {
      logger.error(`Failed to register user ${userId}:`, error);
      throw error;
    }
  }

  async getContract(userId = 'admin') {
    try {
      if (!this.gateway) {
        this.gateway = new Gateway();
        const connectionProfile = this.getConnectionProfile();
        
        await this.gateway.connect(connectionProfile, {
          wallet: this.wallet,
          identity: userId,
          discovery: { enabled: true, asLocalhost: true }
        });
      }

      const network = await this.gateway.getNetwork(this.channelName);
      const contract = network.getContract(this.chaincodeName);
      
      return contract;
    } catch (error) {
      logger.error('Failed to get contract:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.gateway) {
      await this.gateway.disconnect();
      this.gateway = null;
    }
  }

  getConnectionProfile() {
    const networkPath = path.resolve(__dirname, '../..', '..', 'fabric-network');
    const connectionProfilePath = path.join(networkPath, 'connection-profile.json');
    
    if (!fs.existsSync(connectionProfilePath)) {
      // Generate a basic connection profile
      const connectionProfile = {
        name: 'supply-chain-network',
        version: '1.0.0',
        client: {
          organization: this.orgName,
          connection: {
            timeout: {
              peer: { endorser: '300' },
              orderer: '300'
            }
          }
        },
        organizations: {
          [this.orgName]: {
            mspid: this.mspId,
            peers: [`peer0.${this.orgDomain}`],
            certificateAuthorities: [`ca.${this.orgDomain}`]
          }
        },
        peers: {
          [`peer0.${this.orgDomain}`]: {
            url: `grpc://localhost:7051`,
            tlsCACerts: {
              path: path.join(networkPath, `crypto-config/peerOrganizations/${this.orgDomain}/tlsca/tlsca.${this.orgDomain}-cert.pem`)
            },
            grpcOptions: {
              'ssl-target-name-override': `peer0.${this.orgDomain}`
            }
          }
        },
        certificateAuthorities: {
          [`ca.${this.orgDomain}`]: {
            url: `http://localhost:7054`,
            caName: `ca.${this.orgDomain}`,
            tlsCACerts: {
              path: path.join(networkPath, `crypto-config/peerOrganizations/${this.orgDomain}/ca/ca.${this.orgDomain}-cert.pem`)
            },
            httpOptions: {
              verify: false
            }
          }
        }
      };

      fs.writeFileSync(connectionProfilePath, JSON.stringify(connectionProfile, null, 2));
    }

    const connectionProfileJson = fs.readFileSync(connectionProfilePath, 'utf8');
    return JSON.parse(connectionProfileJson);
  }

  getCaInfo() {
    const networkPath = path.resolve(__dirname, '../..', '..', 'fabric-network');
    const caName = `ca.${this.orgDomain}`;
    const caUrl = process.env.CA_ENDPOINT || `http://localhost:7054`;
    
    const caCertPath = path.join(networkPath, `crypto-config/peerOrganizations/${this.orgDomain}/ca/ca.${this.orgDomain}-cert.pem`);
    
    let caCert = '';
    if (fs.existsSync(caCertPath)) {
      caCert = fs.readFileSync(caCertPath, 'utf8');
    }

    return {
      url: caUrl,
      caName: caName,
      tlsCACerts: caCert
    };
  }
}

module.exports = new FabricService();