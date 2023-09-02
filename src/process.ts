import 'dotenv/config'
import xlsx from 'xlsx'
import path from 'path'
import axios, { AxiosResponse } from 'axios'

const API_HOST = process.env.API_HOST || ''
const TENANT = process.env.TENANT || ''

interface IDataPlanilha {
    CPF: string
    Nome: string
    Senha: string
}

interface IDataToSave {
    cpf: string
    name: string
    password: string
}

function readExcel(): IDataToSave[] {
    const listAccess: IDataToSave[] = []

    const pathFile = path.resolve('./data/planilha_modelo_prefeitura.xlsx')
    const workbook = xlsx.readFile(pathFile)
    const sheetNameList = workbook.SheetNames
    const sheetToJson: Array<IDataPlanilha> = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]])

    for (const acesso of sheetToJson) {
        const { CPF, Nome, Senha } = acesso
        if (!CPF || !Nome || !Senha) continue
        const cpf = CPF.toString().normalize('NFD').replace(/[^0-9]/g, '')
        const name = Nome.toString().normalize('NFD').replace(/[^a-zA-Z0-9/ ]/g, '')
        const password = Senha.toString()
        listAccess.push({
            cpf, name, password
        })
    }

    return listAccess
}

async function saveDatabase(dataToSave: IDataToSave[]) {
    for (const access of dataToSave) {
        try {
            await axios.post<any>(API_HOST,
                {
                    idTypeAccessPortals: "6a009e00-47b0-4e45-a28f-87a3481b2060",
                    nameAccess: access.name,
                    login: access.cpf,
                    password: access.password,
                    status: "ACTIVE"
                },
                {
                    headers: {
                        tenant: TENANT
                    }
                }
            )
        } catch (error) {
            if (axios.isAxiosError(error)) {
                return error.response?.data
            } else {
                console.log(error)
            }
        }
    }
}

function processMain() {
    const listAccess = readExcel()
    saveDatabase(listAccess)
}

processMain()

