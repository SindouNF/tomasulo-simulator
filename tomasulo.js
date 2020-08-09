// guardara as configuracoes que serao passadas para o programa
// configuracoes possiveis: num de ciclos de determinado tipo de instrucao
// (ld || sd || multd || divd || addd || subd || add || daddui || beq || bnez) + cycles
let config = {
    "LDcycles": 3,
    "SDcycles": 3,
    "MULTDcycles": 20,
    "DIVDcycles": 40,
    "ADDDcycles": 10,
    "SUBDcycles": 10,
    "ADDcycles": 5, // feito
    "DADDUIcycles": 5, // feito
    "BEQcycles": 5,
    "BNEZcycles": 5
};

class Instruction {
    constructor(inst) {
        // inst = OPCODE RESTO
        this.inst = inst;
        this.opcode = inst.split(" ")[0];
        this.resto = inst.split(" ")[1].split(","); // guarda registradores e/ou label
        // usar o switch para definir exatamente o que terá em cada caso
        // ex: numa inst do tipo ADD, terá RD, RS e RT
        // numa inst do tipo BNEZ, terá RS e LABEL

        switch (this.opcode) {
            case "SD":
                this.type = "S";
                this.i = this.resto[0];
                this.j = this.resto[1].split("(")[0]; // offset
                this.k = this.resto[1].split("(")[1].split(")")[0]; // base
                break;
            case "LD":
                this.type = "L";
                this.i = this.resto[0];
                this.j = this.resto[1].split("(")[0]; // offset
                this.k = this.resto[1].split("(")[1].split(")")[0]; // base

                break;
            case "MULTD":
            case "DIVD":
            case "ADDD":
            case "SUBD":
                this.type = "F";
                this.i = this.resto[0];
                this.j = this.resto[1]; // j
                this.k = this.resto[2]; // k
                break;
            case "ADD":
            case "DADDUI":
                this.type = "R";
                this.i = this.resto[0];
                this.j = this.resto[1]; // j
                this.k = this.resto[2]; // k
                break;
            case "BEQ":
                this.type = "B"
                this.i = this.resto[2]; // i
                this.j = this.resto[0]; // j
                this.k = this.resto[1];
                // caso seja do tipo B, verificar se é BEQ ou BNEZ
                // antes de presumir que tem RT, ou então poderá dar problema
                // pois em BNEZ, rt = undefined
                break;
            case "BNEZ":
                this.type = "B";
                this.i = this.resto[1]; // i
                this.j = this.resto[0];
                break;
        }
        this.cycles = config[this.opcode + "cycles"];
    }
}

class ReservationStation {
    constructor() {
        this.instruction = null;
        this.busy = false;
        this.opcode = null;
        this.vj = null;
        this.vk = null;
        this.qj = null;
        this.qk = null;
        this.time = null; // implementar o tempo do ciclo dentro das estações
        this.start = null;
        // this.locked = null; // indica se está travada ou nÃo, por conflito de reg. - talvez inútil
    }

    add_instruction(instruction, rstations, cycle) {
        this.instruction = instruction;
        this.busy = true;
        this.opcode = instruction.opcode;
        console.log(rstations);
        var j = rstations[0];
        var k = rstations[1];
        if (!j && !k) {
            // caso esteja ok
            this.vj = instruction.j;
            this.vk = instruction.k;
        } else {
            if (j) {
                if (j[0] === "x") {
                    j.shift();
                    this.vj = j;
                } else {
                    this.qj = rstations[0];
                }
            } else {
                this.vj = instruction.j;
            }
            if (k) {
                if (k[0] === "x") {
                    k.shift();
                    this.vk = k;
                } else {
                    this.qk = rstations[1];
                }
            } else {
                this.vk = instruction.k;
            }
        }

        this.time = instruction.cycles;
        this.start = cycle;
    }
    clear() {
        this.instruction = null;
        this.busy = false;
        this.opcode = null;
        this.vj = null;
        this.vk = null;
        this.qj = null;
        this.qk = null;
        this.time = null;
        this.start = null;
    }

    busy() {
        return this.busy;
    }

    decrement_time() {
        // para simular passagem de tempo, quando chegar em 0 significa que terminou de executar
        this.time = this.time - 1;
    }
}

// Unidade de carregamento 
// talvez não seja necessária, podendo usar
// uma reservation station "modificada"
// talvez MEXER
class LoadStoreUnit {
    constructor() {
        this.instruction = null;
        this.busy = false;
        this.address = null;
        this.target = null;
        this.time = null;
        this.FunctUnit = null; // estado atual dos registradores na unidade, indica se alguma inst esta usando
    }

    add_instruction(instruction) {
        this.instruction = instruction;
        this.busy = true;
        this.address = String(instruction.j) + "+" + String(instruction.k);
        this.target = instruction.i;
        this.time = instruction.cycles;
    }

    clear() {
        this.instruction = null;
        this.busy = false;
        this.address = null;
        this.target = null;
        this.time = null;
    }

    decrement_time() {
        this.time = this.time - 1;
    }

    busy() {
        return this.busy;
    }
}

// Qi - the reservation station whose result should be stored in this register (if blank or 0, no values are destined for this register)
class RegisterStatus {
    constructor() {
        this.registers = [];
        this.registers_fp = [];
        for (let i = 0; i < 8; i++) {
            this.registers.push(new Register("R" + i));
            this.registers_fp.push(new Register("F" + (i * 2)));
        }
    }

    get_register(regJ, regK) {
        regJ = regJ.split("");
        regK = regK.split("");
        var typeJ = regJ.shift();
        var typeK = regK.shift();
        regJ = regJ.join("");
        regK = regK.join("");
        var registers = [null, null];
        if (typeJ === "F") {
            registers[0] = (this.registers_fp[(parseInt(regJ) / 2)].station);
        } else if (typeJ === "R") {
            registers[0] = (this.registers[parseInt(regJ)].station);
        }
        if (typeK === "F") {
            registers[1] = (this.registers_fp[(parseInt(regK) / 2)].station);
        } else if (typeK === "R") {
            registers[1] = (this.registers[parseInt(regK)].station);
        }
        return registers;
    }

    add_station(reg, station_type, station_number) {
        reg = reg.split("");
        var type = reg.shift();
        reg = reg.join("");
        if (type === "F") {
            this.registers_fp[(parseInt(reg) / 2)].station = String(station_type) + String(station_number);
        } else if (type === "R") {
            return this.registers[parseInt(reg)].station = String(station_type) + String(station_number);
        }
    }

    get_station(reg) {
        reg = reg.split("");
        var type = reg.shift();
        reg = reg.join("");
        if (type === "F") {
            registers[0] = (this.registers_fp[(parseInt(reg) / 2)].station);
        } else if (type === "R") {
            registers[0] = (this.registers[parseInt(reg)].station);
        }
    }

    update_reg_prefix(reg, station) {
        // usada após escrever
        // coloca um prefixo x no registrador que já terminou exe
        // verifica se a estacao que está no reg é igual a estacao que fez chamar esta funcao
        reg = reg.split("");
        var type = reg.shift();
        reg = reg.join("");
        if (type === "F") {
            if (this.registers_fp[(parseInt(reg) / 2)].station === station) {
                this.registers_fp[(parseInt(reg) / 2)].station = "x" + this.registers_fp[(parseInt(reg) / 2)].station;
            }
        } else if (type === "R") {
            if (this.registers[parseInt(reg)].station === station) {
                this.registers[parseInt(reg)].station = "x" + this.registers[parseInt(reg)].station;
            }
        }
    }

}

// classe para representar um registrador
// guarda um nome de registrador (Ri, i = [0 - 7]) e (F(i * 2), i = 0 - 7)
// e a station que está utilizando ele 
class Register {
    // talvez inutil, mas whatever
    constructor(name) {
        this.name = name;
        this.station = null;
    }
}

// TODO: não sei se seria melhor abordagem, nem se ExeUnit faz sentido neste caso
// mas seria a classe que segura todas as reservation stations
class ExeUnit {
    constructor() {
        this.integer_unit = []; // 3
        this.float_add_sub_unit = []; // 3
        this.float_mult_div_unit = []; // 2
        this.store_unit = []; // 3
        this.load_unit = []; // 6

        this.registers = new RegisterStatus();

        // inicializar unidades
        for (let i = 0; i < 3; i++) {
            // inicializando unidade de inteiro
            this.integer_unit.push(new ReservationStation());
            // inicializando unidade de ponto flutuante - addsub
            this.float_add_sub_unit.push(new ReservationStation());
            // inicializando unidade de store - talvez mudar
            this.store_unit.push(new ReservationStation());
            // inicializando unidade de load - talvez mudar
            this.load_unit.push(new ReservationStation());
            this.load_unit.push(new ReservationStation());
        }
        for (let i = 0; i < 2; i++) {
            // inicializando unidade de ponto flutuante - multdiv
            this.float_mult_div_unit.push(new ReservationStation());
        }
    }

    station_status() {
        console.log("int");
        console.log(this.integer_unit);
        console.log("fadd");
        console.log(this.float_add_sub_unit);
        console.log("md");
        console.log(this.float_mult_div_unit);
        console.log("ld");
        console.log(this.load_unit);
        console.log("sd");
        console.log(this.store_unit);
        console.log(this.registers)
    }

    add_to_station(instruction, cycle) {
        // TODO: terminar de colocar RSTATIONS nas outras instrucoes
        // auxiliar de issue()
        var rstations = this.registers.get_register(instruction.j, instruction.k);
        if (instruction.type === "R") {
            for (let i = 0; i < this.integer_unit.length; i++) {
                if (!this.integer_unit[i].busy) {
                    // tem station disponivel
                    this.integer_unit[i].add_instruction(instruction, rstations, cycle);
                    this.registers.add_station(instruction.i, "IADD", i);
                    return true; // true adicionou
                }
            }
            return false;
        }
        // MEXER <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        else if (instruction.type === "L") {
            for (let i = 0; i < this.load_unit.length; i++) {
                if (!this.load_unit[i].busy) {
                    // tem station disponivel
                    this.load_unit[i].add_instruction(instruction, rstations, cycle);
                    // LD
                    this.registers.add_station(instruction.i, "LD", i);
                    return true; // true adicionou
                }
            }
            return false; // false nao adicionou
        }
        // TALVEZ MEXER <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        else if (instruction.type === "B") {
            for (let i = 0; i < this.integer_unit.length; i++) {
                if (!this.integer_unit[i].busy) {
                    // tem station disponivel
                    this.integer_unit[i].add_instruction(instruction, rstations, cycle);
                    this.registers.add_station(instruction.i, "IADD", i);
                    return true; // true adicionou
                }
            }
            return false; // false nao adicionou
        } else if (instruction.type === "F") {
            if (instruction.opcode === "MULTD" || instruction.opcode === "DIVD") {
                for (let i = 0; i < this.float_mult_div_unit.length; i++) {

                    if (!this.float_mult_div_unit[i].busy) {

                        // tem station disponivel
                        this.float_mult_div_unit[i].add_instruction(instruction, rstations, cycle);
                        this.registers.add_station(instruction.i, "MD", i);
                        return true; // true adicionou
                    }
                }
                return false; // false nao adicionou
            } else {
                for (let i = 0; i < this.float_add_sub_unit.length; i++) {
                    if (!this.float_add_sub_unit[i].busy) {
                        // tem station disponivel
                        this.float_add_sub_unit[i].add_instruction(instruction, rstations, cycle);
                        this.registers.add_station(instruction.i, "FADD", i);
                        return true; // true adicionou
                    }
                }
                return false;
            }
        }
        // MEXER <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        else {
            // instrucao do tipo S
            for (let i = 0; i < this.store_unit.length; i++) {
                if (!this.store_unit[i].busy) {
                    console.log("asdasdsa");
                    // tem station disponivel
                    this.store_unit[i].add_instruction(instruction, rstations, cycle);
                    this.registers.add_station(instruction.i, "SD", i);
                    return true; // true adicionou
                }
            }
            return false; // false nao adicionou
        }
    }
    // nome temporário, funcao que decrementa o tempo das instrucoes que estiverem numa reservation station
    // de forma a simular a execucao
    run_stations(cycle) {
        // auxiliar de execute()
        // percorre todas stations e verifica se pode decrementar
        // decrementar no caso: simular execucão, passagem de um ciclo
        // quando chegar a 0 na station, enviar a/as instrucao/os p/ que execute
        // escreva o ciclo que terminou 
        // quando chegar em 0, retornar quais instrucoes voltaram para que
        // a tabela seja atualizada

        // TODO: escrever execucao das outras instrucoes
        var stations_finished = []; // guarda as stations que terminaram de executar
        for (let i = 0; i < 3; i++) {
            // unidades de inteiro
            if (this.integer_unit[i].busy) {
                // nesse caso tem instrucao
                if (this.integer_unit[i].qj === null && this.integer_unit[i].qk === null && this.integer_unit[i].start !== cycle) {
                    // nesse caso, está pronto para executar
                    this.integer_unit[i].decrement_time();
                    if (this.integer_unit[i].time === 0) {
                        stations_finished.push(this.integer_unit[i]);
                    }
                }
            }

            if (this.float_add_sub_unit[i].busy) {
                if (this.float_add_sub_unit[i].qj === null && this.float_add_sub_unit[i].qk === null && this.float_add_sub_unit[i].start !== cycle) {
                    this.float_add_sub_unit[i].decrement_time();
                    if (this.float_add_sub_unit[i].time === 0) {
                        stations_finished.push(this.float_add_sub_unit[i]);
                    }
                }
            }

            // TODO _______________ TALVEZ ERRADO

            if (this.store_unit[i].busy) {
                // nesse caso tem instrucao
                if (this.store_unit[i].qj === null && this.store_unit[i].qk === null && this.store_unit[i].start !== cycle) {
                    // nesse caso, está pronto para executar
                    this.store_unit[i].decrement_time();
                    if (this.store_unit[i].time === 0) {
                        stations_finished.push(this.store_unit[i]);
                    }
                }
            }

            if (this.load_unit[i].busy) {
                // nesse caso tem instrucao
                if (this.load_unit[i].qj === null && this.load_unit[i].qk === null && this.load_unit[i].start !== cycle) {
                    // nesse caso, está pronto para executar
                    this.load_unit[i].decrement_time();
                    if (this.load_unit[i].time === 0) {
                        stations_finished.push(this.load_unit[i]);
                    }
                }
            }

            if (this.load_unit[i + 3].busy) {
                // nesse caso tem instrucao
                if (this.load_unit[i + 3].qj === null && this.load_unit[i + 3].qk === null && this.load_unit[i + 3].start !== cycle) {
                    // nesse caso, está pronto para executar
                    this.load_unit[i + 3].decrement_time();
                    if (this.load_unit[i + 3].time === 0) {
                        stations_finished.push(this.load_unit[i + 3]);
                    }
                }
            }
            /*
            // inicializando unidade de store - talvez mudar
            this.store_unit.push(new ReservationStation());
            // inicializando unidade de load - talvez mudar
            this.load_unit.push(new LoadStoreUnit());
            this.load_unit.push(new LoadStoreUnit());
            */
        }

        for (let i = 0; i < 2; i++) {
            // inicializando unidade de ponto flutuante - multdiv
            if (this.float_mult_div_unit[i].busy) {
                if (this.float_mult_div_unit[i].qj === null && this.float_mult_div_unit[i].qk === null && this.float_mult_div_unit[i].start !== cycle) {
                    this.float_mult_div_unit[i].decrement_time();
                    if (this.float_mult_div_unit[i].time === 0) {
                        stations_finished.push(this.float_mult_div_unit[i]);
                    }
                }
            }
        }
        return stations_finished;
    }

    remove_from_station(instruction) {
        // auxiliar de write()
        // p/ cada instrucao que remover, deve percorrer tudo novamente
        // 
        // percorre registers caçando x ?
        // remove a instrucao que escreveu
        // acessa os registradores que fazem algo nela
        // e coloca o prefixo x
        // verifica tipo da instrucao
        // percorre as estacoes daquele tipo
        // acha a estacao da instruction
        // verifica em todas as estacoes se ela está em qj ou qk
        // depois, acessa registers e verifica se aquele registrador
        // eh o que esta
        // se for, usar a funcao add prefix
        // achando a estacao, acessa diretamente registers
        // só percorro
        if (instruction.type === "R" || instruction.type === "B") {
            for (let i = 0; i < this.integer_unit.length; i++) {
                if (this.integer_unit[i].instruction === instruction) {
                    // instruction i = o que foi escrito
                    // pode ser o j e o k de algum
                    for (let j = 0; j < 3; j++) {
                        // para inteiro e B
                        if (this.integer_unit[j].qj === ("IADD" + i)) {
                            this.integer_unit[j].vj = "x" + this.integer_unit[j].qj;
                            this.integer_unit[j].qj = null;
                        }
                        if (this.integer_unit[j].qk === ("IADD" + i)) {
                            this.integer_unit[j].vk = "x" + this.integer_unit[j].qk;
                            this.integer_unit[j].qk = null;
                        }
                        // outros tipos <<<<<< TODO

                        // para float addsub
                        console.log(this.float_add_sub_unit[j].qj);
                        if (this.float_add_sub_unit[j].qj === ("IADD" + i)) {
                            console.log("caiu aqui");
                            this.float_add_sub_unit[j].vj = "x" + this.float_add_sub_unit[j].qj;
                            this.float_add_sub_unit[j].qj = null;
                        }
                        if (this.float_add_sub_unit[j].qk === ("IADD" + i)) {
                            this.float_add_sub_unit[j].vk = "x" + this.float_add_sub_unit[j].qk;
                            this.float_add_sub_unit[j].qk = null;
                        }
                        // para load
                        if (this.load_unit[j].qj === ("IADD" + i)) {
                            console.log("caiu aqui");
                            this.load_unit[j].vj = "x" + this.load_unit[j].qj;
                            this.load_unit[j].qj = null;
                        }
                        if (this.load_unit[j].qk === ("IADD" + i)) {
                            this.load_unit[j].vk = "x" + this.load_unit[j].qk;
                            this.load_unit[j].qk = null;
                        }

                        if (this.load_unit[j + 3].qj === ("IADD" + i)) {
                            console.log("caiu aqui");
                            this.load_unit[j + 3].vj = "x" + this.load_unit[j + 3].qj;
                            this.load_unit[j + 3].qj = null;
                        }
                        if (this.load_unit[j + 3].qk === ("IADD" + i)) {
                            this.load_unit[j + 3].vk = "x" + this.load_unit[j + 3].qk;
                            this.load_unit[j + 3].qk = null;
                        }

                        // para store
                        if (this.store_unit[j].qj === ("IADD" + i)) {
                            console.log("caiu aqui");
                            this.store_unit[j].vj = "x" + this.store_unit[j].qj;
                            this.store_unit[j].qj = null;
                        }
                        if (this.store_unit[j].qk === ("IADD" + i)) {
                            this.store_unit[j].vk = "x" + this.store_unit[j].qk;
                            this.store_unit[j].qk = null;
                        }

                    }

                    for (let j = 0; j < 2; j++) {
                        // para float multdiv
                        if (this.float_mult_div_unit[j].qj === ("IADD" + i)) {
                            this.float_mult_div_unit[j].vj = "x" + this.float_mult_div_unit[j].qj;
                            this.float_mult_div_unit[j].qj = null;
                        }
                        if (this.float_mult_div_unit[j].qk === ("IADD" + i)) {
                            this.float_mult_div_unit[j].vk = "x" + this.float_mult_div_unit[j].qk;
                            this.float_mult_div_unit[j].qk = null;
                        }
                    }

                    this.registers.update_reg_prefix(instruction.i, ("IADD" + i));
                    this.integer_unit[i].clear();
                    return;
                }
            }
        } else if (instruction.type === "S") {
            for (let i = 0; i < this.store_unit.length; i++) {
                if (this.store_unit[i].instruction === instruction) {
                    // instruction i = o que foi escrito
                    // pode ser o j e o k de algum
                    for (let j = 0; j < 3; j++) {
                        // para inteiro e B
                        if (this.integer_unit[j].qj === ("SD" + i)) {
                            this.integer_unit[j].vj = "x" + this.integer_unit[j].qj;
                            this.integer_unit[j].qj = null;
                        }
                        if (this.integer_unit[j].qk === ("SD" + i)) {
                            this.integer_unit[j].vk = "x" + this.integer_unit[j].qk;
                            this.integer_unit[j].qk = null;
                        }


                        // para float addsub
                        console.log(this.float_add_sub_unit[j].qj);
                        if (this.float_add_sub_unit[j].qj === ("SD" + i)) {
                            console.log("caiu aqui");
                            this.float_add_sub_unit[j].vj = "x" + this.float_add_sub_unit[j].qj;
                            this.float_add_sub_unit[j].qj = null;
                        }
                        if (this.float_add_sub_unit[j].qk === ("SD" + i)) {
                            this.float_add_sub_unit[j].vk = "x" + this.float_add_sub_unit[j].qk;
                            this.float_add_sub_unit[j].qk = null;
                        }
                        // para load
                        if (this.load_unit[j].qj === ("SD" + i)) {
                            console.log("caiu aqui");
                            this.load_unit[j].vj = "x" + this.load_unit[j].qj;
                            this.load_unit[j].qj = null;
                        }
                        if (this.load_unit[j].qk === ("SD" + i)) {
                            this.load_unit[j].vk = "x" + this.load_unit[j].qk;
                            this.load_unit[j].qk = null;
                        }

                        if (this.load_unit[j + 3].qj === ("SD" + i)) {
                            console.log("caiu aqui");
                            this.load_unit[j + 3].vj = "x" + this.load_unit[j + 3].qj;
                            this.load_unit[j + 3].qj = null;
                        }
                        if (this.load_unit[j + 3].qk === ("SD" + i)) {
                            this.load_unit[j + 3].vk = "x" + this.load_unit[j + 3].qk;
                            this.load_unit[j + 3].qk = null;
                        }

                        // para store
                        if (this.store_unit[j].qj === ("SD" + i)) {
                            console.log("caiu aqui");
                            this.store_unit[j].vj = "x" + this.store_unit[j].qj;
                            this.store_unit[j].qj = null;
                        }
                        if (this.store_unit[j].qk === ("SD" + i)) {
                            this.store_unit[j].vk = "x" + this.store_unit[j].qk;
                            this.store_unit[j].qk = null;
                        }

                        // outros tipos <<<<<< TODO
                    }
                    for (let j = 0; j < 2; j++) {
                        // para float multdiv
                        if (this.float_mult_div_unit[j].qj === ("SD" + i)) {
                            this.float_mult_div_unit[j].vj = "x" + this.float_mult_div_unit[j].qj;
                            this.float_mult_div_unit[j].qj = null;
                        }
                        if (this.float_mult_div_unit[j].qk === ("SD" + i)) {
                            this.float_mult_div_unit[j].vk = "x" + this.float_mult_div_unit[j].qk;
                            this.float_mult_div_unit[j].qk = null;
                        }
                    }
                    this.registers.update_reg_prefix(instruction.i, ("SD" + i));
                    this.integer_unit[i].clear();
                    return;
                }
            }
        } else if (instruction.type === "L") {
            for (let i = 0; i < this.load_unit.length; i++) {
                if (this.load_unit[i].instruction === instruction) {
                    // instruction i = o que foi escrito
                    // pode ser o j e o k de algum
                    for (let j = 0; j < 3; j++) {
                        // para inteiro e B
                        if (this.integer_unit[j].qj === ("LD" + i)) {
                            this.integer_unit[j].vj = "x" + this.integer_unit[j].qj;
                            this.integer_unit[j].qj = null;
                        }
                        if (this.integer_unit[j].qk === ("LD" + i)) {
                            this.integer_unit[j].vk = "x" + this.integer_unit[j].qk;
                            this.integer_unit[j].qk = null;
                        }


                        // para float addsub
                        console.log(this.float_add_sub_unit[j].qj);
                        if (this.float_add_sub_unit[j].qj === ("LD" + i)) {
                            console.log("caiu aqui");
                            this.float_add_sub_unit[j].vj = "x" + this.float_add_sub_unit[j].qj;
                            this.float_add_sub_unit[j].qj = null;
                        }
                        if (this.float_add_sub_unit[j].qk === ("LD" + i)) {
                            this.float_add_sub_unit[j].vk = "x" + this.float_add_sub_unit[j].qk;
                            this.float_add_sub_unit[j].qk = null;
                        }
                        // para load
                        if (this.load_unit[j].qj === ("LD" + i)) {
                            console.log("caiu aqui");
                            this.load_unit[j].vj = "x" + this.load_unit[j].qj;
                            this.load_unit[j].qj = null;
                        }
                        if (this.load_unit[j].qk === ("LD" + i)) {
                            this.load_unit[j].vk = "x" + this.load_unit[j].qk;
                            this.load_unit[j].qk = null;
                        }

                        if (this.load_unit[j + 3].qj === ("LD" + i)) {
                            console.log("caiu aqui");
                            this.load_unit[j + 3].vj = "x" + this.load_unit[j + 3].qj;
                            this.load_unit[j + 3].qj = null;
                        }
                        if (this.load_unit[j + 3].qk === ("LD" + i)) {
                            this.load_unit[j + 3].vk = "x" + this.load_unit[j + 3].qk;
                            this.load_unit[j + 3].qk = null;
                        }

                        // para store
                        if (this.store_unit[j].qj === ("LD" + i)) {
                            console.log("caiu aqui");
                            this.store_unit[j].vj = "x" + this.store_unit[j].qj;
                            this.store_unit[j].qj = null;
                        }
                        if (this.store_unit[j].qk === ("LD" + i)) {
                            this.store_unit[j].vk = "x" + this.store_unit[j].qk;
                            this.store_unit[j].qk = null;
                        }

                        // outros tipos <<<<<< TODO
                    }
                    for (let j = 0; j < 2; j++) {
                        // para float multdiv
                        if (this.float_mult_div_unit[j].qj === ("LD" + i)) {
                            this.float_mult_div_unit[j].vj = "x" + this.float_mult_div_unit[j].qj;
                            this.float_mult_div_unit[j].qj = null;
                        }
                        if (this.float_mult_div_unit[j].qk === ("LD" + i)) {
                            this.float_mult_div_unit[j].vk = "x" + this.float_mult_div_unit[j].qk;
                            this.float_mult_div_unit[j].qk = null;
                        }
                    }
                    this.registers.update_reg_prefix(instruction.i, ("LD" + i));
                    this.integer_unit[i].clear();
                    return;
                }
            }
        } else if (instruction.type === "F") {
            if (instruction.opcode === "MULTD" || instruction.opcode === "DIVD") {
                for (let i = 0; i < this.float_mult_div_unit.length; i++) {
                    if (this.float_mult_div_unit[i].instruction === instruction) {
                        for (let j = 0; j < 3; j++) {
                            // para float addsub
                            console.log(this.float_add_sub_unit[j].qj);
                            if (this.float_add_sub_unit[j].qj === ("MD" + i)) {
                                console.log("caiu aqui");
                                this.float_add_sub_unit[j].vj = "x" + this.float_add_sub_unit[j].qj;
                                this.float_add_sub_unit[j].qj = null;
                            }
                            if (this.float_add_sub_unit[j].qk === ("MD" + i)) {
                                this.float_add_sub_unit[j].vk = "x" + this.float_add_sub_unit[j].qk;
                                this.float_add_sub_unit[j].qk = null;
                            }
                            // para outras instrucoes - LD e SD

                            // para load
                            if (this.load_unit[j].qj === ("MD" + i)) {
                                console.log("caiu aqui");
                                this.load_unit[j].vj = "x" + this.load_unit[j].qj;
                                this.load_unit[j].qj = null;
                            }
                            if (this.load_unit[j].qk === ("MD" + i)) {
                                this.load_unit[j].vk = "x" + this.load_unit[j].qk;
                                this.load_unit[j].qk = null;
                            }

                            if (this.load_unit[j + 3].qj === ("MD" + i)) {
                                console.log("caiu aqui");
                                this.load_unit[j + 3].vj = "x" + this.load_unit[j + 3].qj;
                                this.load_unit[j + 3].qj = null;
                            }
                            if (this.load_unit[j + 3].qk === ("MD" + i)) {
                                this.load_unit[j + 3].vk = "x" + this.load_unit[j + 3].qk;
                                this.load_unit[j + 3].qk = null;
                            }

                            // para store
                            if (this.store_unit[j].qj === ("MD" + i)) {
                                console.log("caiu aqui");
                                this.store_unit[j].vj = "x" + this.store_unit[j].qj;
                                this.store_unit[j].qj = null;
                            }
                            if (this.store_unit[j].qk === ("MD" + i)) {
                                this.store_unit[j].vk = "x" + this.store_unit[j].qk;
                                this.store_unit[j].qk = null;
                            }

                        }

                        for (let j = 0; j < 2; j++) {
                            // para float multdiv
                            if (this.float_mult_div_unit[j].qj === ("MD" + i)) {
                                this.float_mult_div_unit[j].vj = "x" + this.float_mult_div_unit[j].qj;
                                this.float_mult_div_unit[j].qj = null;
                            }
                            if (this.float_mult_div_unit[j].qk === ("MD" + i)) {
                                this.float_mult_div_unit[j].vk = "x" + this.float_mult_div_unit[j].qk;
                                this.float_mult_div_unit[j].qk = null;
                            }
                        }
                        this.registers.update_reg_prefix(instruction.i, ("MD" + i));
                        this.float_mult_div_unit[i].clear();
                        return;
                    }

                }
            } else {
                for (let i = 0; i < this.float_add_sub_unit.length; i++) {
                    if (this.float_add_sub_unit[i].instruction === instruction) {
                        for (let j = 0; j < 3; j++) {
                            // para float addsub
                            if (this.float_add_sub_unit[j].qj === ("FADD" + i)) {
                                this.float_add_sub_unit[j].vj = "x" + this.float_add_sub_unit[j].qj;
                                this.float_add_sub_unit[j].qj = null;
                            }
                            if (this.float_add_sub_unit[j].qk === ("FADD" + i)) {
                                this.float_add_sub_unit[j].vk = "x" + this.float_add_sub_unit[j].qk;
                                this.float_add_sub_unit[j].qk = null;
                            }
                            // para outras instrucoes - LD e SD

                            // para load
                            if (this.load_unit[j].qj === ("FADD" + i)) {
                                console.log("caiu aqui");
                                this.load_unit[j].vj = "x" + this.load_unit[j].qj;
                                this.load_unit[j].qj = null;
                            }
                            if (this.load_unit[j].qk === ("FADD" + i)) {
                                this.load_unit[j].vk = "x" + this.load_unit[j].qk;
                                this.load_unit[j].qk = null;
                            }

                            if (this.load_unit[j + 3].qj === ("FADD" + i)) {
                                console.log("caiu aqui");
                                this.load_unit[j + 3].vj = "x" + this.load_unit[j + 3].qj;
                                this.load_unit[j + 3].qj = null;
                            }
                            if (this.load_unit[j + 3].qk === ("FADD" + i)) {
                                this.load_unit[j + 3].vk = "x" + this.load_unit[j + 3].qk;
                                this.load_unit[j + 3].qk = null;
                            }

                            // para store
                            if (this.store_unit[j].qj === ("FADD" + i)) {
                                console.log("caiu aqui");
                                this.store_unit[j].vj = "x" + this.store_unit[j].qj;
                                this.store_unit[j].qj = null;
                            }
                            if (this.store_unit[j].qk === ("FADD" + i)) {
                                this.store_unit[j].vk = "x" + this.store_unit[j].qk;
                                this.store_unit[j].qk = null;
                            }
                        }
                        for (let j = 0; j < 2; j++) {
                            // para float multdiv
                            if (this.float_mult_div_unit[j].qj === ("FADD" + i)) {
                                this.float_mult_div_unit[j].vj = "x" + this.float_mult_div_unit[j].qj;
                                this.float_mult_div_unit[j].qj = null;
                            }
                            if (this.float_mult_div_unit[j].qk === ("FADD" + i)) {
                                this.float_mult_div_unit[j].vk = "x" + this.float_mult_div_unit[j].qk;
                                this.float_mult_div_unit[j].qk = null;
                            }
                        }
                        this.registers.update_reg_prefix(instruction.i, ("FADD" + i));
                        this.float_add_sub_unit[i].clear();
                        return;
                    }

                }
            }
        }

    }
}

// a classe que junta tudo
class Tomasulo {
    constructor(inst) {
        this.execution_unit = new ExeUnit();
        this.instructions = inst;
        this.instructions_w = this.instructions.length(); // guarda numero de isntrucoes que nao foram esctiras
        this.table = new InstructionTable(); // guarda todas as instrucoes, tabela que exibe onde cada 
        // table = 2 arrays, um para inst e outro para status: [inst, (...)] e [["ciclo issue", "ciclo exe", "ciclo write"], (...)] 
        this.cycle = 1;
        this.finished = false;
    }
    issue(cycle) {
        var next_inst = this.instructions.peek();
        if (this.execution_unit.add_to_station(next_inst, cycle)) {
            console.log("add");
            console.log(next_inst);
            this.table.add(next_inst, cycle);
            this.instructions.pop_front();
        }
        /*
        Retrieve the next instruction from the head of the instruction queue. If the instruction operands are currently in the registers, then
            If a matching functional unit is available, issue the instruction.
            Else, as there is no available functional unit, stall the instruction until a station or buffer is free.
        Otherwise, we can assume the operands are not in the registers, and so use virtual values. The functional unit must calculate the real value to keep track of the functional units that produce the operand.
        */

    };
    execute(cycle) {
        // verifica se eh possivel terminar de executar a instrucao
        // quando time = 0 na reserv station, significa que terminou de executar
        // dai limpar a station e adicionar o ciclo na tabela na instrucao

        /*
        If one or more of the operands is not yet available then: wait for operand to become available on the CDB.
        When all operands are available, then: if the instruction is a load or store
            Compute the effective address when the base register is available, and place it in the load/store buffer
                If the instruction is a load then: execute as soon as the memory unit is available
                Else, if the instruction is a store then: wait for the value to be stored before sending it to the memory unit
        Else, the instruction is an arithmetic logic unit (ALU) operation then: execute the instruction at the corresponding functional unit
        */
        // no final, recebe stations_finished e escreve
        var stations_finished = this.execution_unit.run_stations(cycle);
        for (let i = 0; i < stations_finished.length; i++) {
            // p/ cada instrucao de cá, percorrer tabela de instrucao
            // e escrever
            for (let j = 0; j < this.table.instructions.length; j++) {
                if (stations_finished[i].instruction === this.table.instructions[j]) {
                    this.table.status[j].push(cycle);
                }
            }
        }
    };
    write(cycle) {
        // se conseguir escrever, decrementar 1 de instructions_w
        for (let i = 0; i < this.table.instructions.length; i++) {
            if (this.table.status[i].length !== 2) {
                continue;
            }
            // se a execucao terminou no ciclo anterior, significa que devo escrever neste atual
            if (this.table.status[i][1] === (cycle - 1) && this.table.status[i][2] === undefined) {
                this.table.status[i].push(cycle);
                this.execution_unit.remove_from_station(this.table.instructions[i]);

                /*
                If the instruction was an ALU operation
                    If the result is available, then: write it on the CDB and from there into the registers and any reservation stations waiting for this result
                Else, if the instruction was a store then: write the data to memory during this step
                */
                // this.table.instructions[i] -> a instrucao que foi escrita
                // acessa exe_unit e "limpa" tudo que era dependente da instrucao
                this.instructions_w--;
            }
        }
    };
    run() {
        // cada vez que aperta um botao ele chama run
        // se ainda houver instruções na fila
        // e ainda houver isntruções que não foram escritas (instructions_w > 0)
        if (!this.finished) {
            console.log("executando: " + this.cycle);
            // verifica tipo da instrucao
            // 
            console.log("instructions");
            if (!this.instructions.empty()) {
                // se fila de isntrucoes não estiver vazia, precisa tentar dar issue 
                this.issue(this.cycle);
            }
            this.execute(this.cycle);
            this.write(this.cycle);

            this.execution_unit.station_status();

            // antes de incrementar ciclo, atualizar diagramas das reservation stations e register status
            // TODO: funcao para atualizar diagramas

            this.table.print_inst_status();
            if (this.instructions_w > 0) {
                this.cycle++;
            } else {
                this.finished = true;
            }
        }
    }
}

class Queue {
    constructor(inst) {
        this.q = [];
    }

    peek() {
        return this.q[0];
    }

    push_back(obj) {
        this.q.push(obj);
    }

    pop_front() {
        return this.q.shift();
    }

    length() {
        return this.q.length;
    }

    empty() {
        return Array.isArray(this.q) && this.q.length === 0;
    }
}

class InstructionTable {
    constructor() {
        this.instructions = [];
        this.status = [];
    }

    add(instruction, cycle) {
        this.instructions.push(instruction);
        this.status.push([cycle]);
    }

    print_inst_status() {
        console.log(this.instructions);
        console.log(this.status);
    }
}

/////////////// logica principal

function read_file() {
    $.get("https://files.catbox.moe/f3n14x.txt", function() {}).fail(function() {}).done(function(data) {
        x = new Queue();
        data = data.split("\n");
        for (let i = 0; i < data.length; i++) {
            x.push_back(new Instruction(data[i]));
        }
        t = new Tomasulo(x);
    });
}

function load_string() {
    var data = "MULTD F0,F2,F4\nADDD F4,F0,F2\nDIVD F6,F0,F2\nADD R1,R3,R5\nSUBD F8,F6,F2\nDADDUI R3,R2,17";
    data = data.split("\n");
    x = new Queue();
    for (let i = 0; i < data.length; i++) {
        x.push_back(new Instruction(data[i]));
    }
    t = new Tomasulo(x);
}

function help() {
    a = "Dicas de uso: \nPara inserir uma intrução na unidade escolha as instruções a serem utilizadas e seus respectivos registradores, então clique em 'CONFIRMAR' para executar os dados ou 'RESET' para limpar os campos\n\nO botão 'Próximo' avançará para o proximo ciclo e o botão 'Resultado' apresenta o resultado final da execução do algoritmo";
    alert(a);
}

var t;

function fast() {
    var i = 0;
    while (i < 60) {
        t.run();
        i++;
    };
}

// modo lento
// on button click: t.run()

// modo rapido
// while (!t.over): t.run()

// pega instruction da entrada, joga para a reservation station e executa